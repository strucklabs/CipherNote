export type NoteSource = 'text' | 'clipboard' | 'image' | 'audio';

export interface NoteAttachment {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'file';
  mimeType: string;
  dataUrl: string; // Base64 Data URL
  sizeBytes: number;
  createdAt: number;
  durationSeconds?: number; // Optional duration for audio
}

export interface EncryptedNoteRecord {
  id: string;
  ciphertext: string;       // Base64-encoded AES-GCM encrypted payload
  iv: string;               // Base64-encoded 96-bit IV
  salt: string;             // Base64-encoded salt
  isPinned: boolean;
  deadline: string | null;  // ISO string (e.g. 2026-11-08T18:00:00.000Z) or null
  createdAt: number;        // Unix timestamp (ms)
  updatedAt: number;        // Unix timestamp (ms)
  source: NoteSource;
  tags: string[];           // Non-sensitive tag slugs for indexing
}

export interface DecryptedNotePayload {
  title: string;
  content: string;
  tags?: string[];
  attachments?: NoteAttachment[];
}

export interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  deadline: string | null;
  createdAt: number;
  updatedAt: number;
  source: NoteSource;
  attachments?: NoteAttachment[];
}

export interface VaultConfig {
  salt: string;                 // Base64-encoded salt
  verificationCiphertext: string; // Known test string encrypted with the derived key
  verificationIv: string;
  createdAt: number;
  lastUnlockedAt?: number;
}

export type FilterOption = 'all' | 'pinned' | 'deadlines' | 'clipboard';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
