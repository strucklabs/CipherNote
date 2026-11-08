import { EncryptedNoteRecord, VaultConfig, DecryptedNote, DecryptedNotePayload } from '../types';
import {
  generateRandomSalt,
  deriveKey,
  createVaultVerification,
  verifyVaultKey,
  encryptText,
  decryptText,
  bufferToBase64,
  base64ToBuffer,
} from './crypto';

const STORAGE_VAULT_KEY = 'cipher_vault_config_v1';
const STORAGE_NOTES_KEY = 'cipher_encrypted_notes_v1';
const STORAGE_SYNC_KEY = 'cipher_sync_channel_v1';

export function getVaultConfig(): VaultConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_VAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveVaultConfig(config: VaultConfig) {
  localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(config));
}

export function resetVault() {
  localStorage.removeItem(STORAGE_VAULT_KEY);
  localStorage.removeItem(STORAGE_NOTES_KEY);
  localStorage.removeItem(STORAGE_SYNC_KEY);
}

export function getEncryptedNotes(): EncryptedNoteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEncryptedNotes(notes: EncryptedNoteRecord[]) {
  try {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('localStorage quota warning while saving notes:', err);
    try {
      localStorage.removeItem('cipher_pending_share');
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch (retryErr) {
      console.error('Critical storage limit reached in localStorage:', retryErr);
    }
  }

  // Broadcast update to other tabs/windows for live sync
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, String(Date.now()));
  } catch {
    // Ignore storage broadcast failures
  }
}

export async function initializeNewVault(passphrase: string): Promise<{ key: CryptoKey; config: VaultConfig }> {
  const salt = generateRandomSalt(16);
  const key = await deriveKey(passphrase, salt);
  const verification = await createVaultVerification(key);

  const config: VaultConfig = {
    salt: bufferToBase64(salt),
    verificationCiphertext: verification.ciphertext,
    verificationIv: verification.iv,
    createdAt: Date.now(),
    lastUnlockedAt: Date.now(),
  };

  saveVaultConfig(config);
  return { key, config };
}

export async function unlockVaultWithPassphrase(passphrase: string): Promise<CryptoKey | null> {
  const config = getVaultConfig();
  if (!config) return null;

  const saltBytes = base64ToBuffer(config.salt);
  const key = await deriveKey(passphrase, saltBytes);
  const isValid = await verifyVaultKey(key, config.verificationCiphertext, config.verificationIv);

  if (!isValid) {
    return null;
  }

  config.lastUnlockedAt = Date.now();
  saveVaultConfig(config);
  return key;
}

export async function decryptAllNotes(
  records: EncryptedNoteRecord[],
  key: CryptoKey
): Promise<DecryptedNote[]> {
  const decrypted: DecryptedNote[] = [];

  for (const record of records) {
    try {
      const plaintext = await decryptText(record.ciphertext, record.iv, key);
      const parsed: DecryptedNotePayload = JSON.parse(plaintext);
      decrypted.push({
        id: record.id,
        title: parsed.title || 'Ohne Titel',
        content: parsed.content || '',
        tags: parsed.tags || record.tags || [],
        isPinned: record.isPinned,
        deadline: record.deadline,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        source: record.source,
        attachments: parsed.attachments || [],
      });
    } catch (err) {
      console.warn(`Could not decrypt note ${record.id}:`, err);
    }
  }

  // Sort notes: Pinned first, then newest first (chronological order)
  return decrypted.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

export async function encryptNotePayload(
  note: DecryptedNote,
  key: CryptoKey,
  saltBase64: string
): Promise<EncryptedNoteRecord> {
  const payload: DecryptedNotePayload = {
    title: note.title,
    content: note.content,
    tags: note.tags,
    attachments: note.attachments,
  };
  const json = JSON.stringify(payload);
  const enc = await encryptText(json, key);

  return {
    id: note.id,
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    salt: saltBase64,
    isPinned: note.isPinned,
    deadline: note.deadline,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    source: note.source,
    tags: note.tags,
  };
}

export async function seedInitialSampleNotes(key: CryptoKey, saltBase64: string): Promise<DecryptedNote[]> {
  const now = Date.now();
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const nextWeek = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

  const samples: DecryptedNote[] = [
    {
      id: 'note-welcome-1',
      title: 'Willkommen bei CipherNote',
      content: `# Willkommen in Ihrem verschlüsselten Tresor!

CipherNote schützt Ihre Notizen und Zwischenablage-Inhalte mit echter **AES-256-GCM End-to-End-Verschlüsselung**.

### Schnelleinstieg:
- **Zwischenablage erfassen**: Tippen Sie auf **„Aus Zwischenablage erfassen“** (oder am Desktop überall **Strg+V**).
- **Inhalte per „Teilen“ empfangen**: Senden Sie Links, Texte oder Zitate aus beliebigen Android-Apps über das Android-Teilen-Menü direkt an CipherNote!
- **Notizen teilen**: Tippen Sie im Editor auf das **Teilen-Symbol**, um Notizen direkt per WhatsApp, Messenger oder E-Mail zu teilen.
- **Wichtiges anpinnen**: Fixieren Sie Prioritäten mit der **Nadel** ganz oben in der Liste.
- **Deadlines & Fristen**: Weisen Sie Notizen ein Fälligkeitsdatum zu, um rechtzeitig erinnert zu werden.

Ihre Daten bleiben stets lokal verschlüsselt und verlassen Ihr Gerät niemals im Klartext.`,
      tags: ['Sicherheit', 'Einführung'],
      isPinned: true,
      deadline: tomorrow,
      createdAt: now - 3600_000,
      updatedAt: now - 3600_000,
      source: 'text',
    },
    {
      id: 'note-clipboard-sample',
      title: 'Beispiel: Zwischenablage Code-Snippet',
      content: `// Zwischenablage erfasst: 2026-11-07
const authenticateUser = async (token: string) => {
  const verified = await crypto.subtle.verify(...);
  return verified;
};

// Schnellnotiz: API-Endpunkt montags auf v2 migrieren`,
      tags: ['Code', 'Clipboard'],
      isPinned: false,
      deadline: nextWeek,
      createdAt: now - 1800_000,
      updatedAt: now - 1800_000,
      source: 'clipboard',
    },
    {
      id: 'note-todo-deadline',
      title: 'Projektbericht & Budgetfreigabe Q4',
      content: `Prüfung der Monatsabschlüsse und Freigabe für das Entwicklungsteam.

- [ ] Sicherheitsaudit abschließen
- [ ] Verschlüsselungs-Benchmarks dokumentieren
- [ ] Backup auf externem Gerät verifizieren`,
      tags: ['Arbeit', 'Deadline'],
      isPinned: false,
      deadline: new Date(now + 3 * 3600_000).toISOString(), // in 3 hours
      createdAt: now - 900_000,
      updatedAt: now - 900_000,
      source: 'text',
    },
  ];

  const encryptedRecords: EncryptedNoteRecord[] = [];
  for (const s of samples) {
    const enc = await encryptNotePayload(s, key, saltBase64);
    encryptedRecords.push(enc);
  }

  saveEncryptedNotes(encryptedRecords);
  return samples;
}
