import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  VaultConfig,
  EncryptedNoteRecord,
  DecryptedNote,
  NoteAttachment,
  FilterOption,
  SyncState,
} from './types';
import { compressImage, readFileAsDataUrl } from './lib/media';
import {
  getVaultConfig,
  getEncryptedNotes,
  saveEncryptedNotes,
  initializeNewVault,
  unlockVaultWithPassphrase,
  decryptAllNotes,
  encryptNotePayload,
  seedInitialSampleNotes,
  resetVault,
} from './lib/storage';
import { TopBar } from './components/TopBar';
import { VaultLockModal } from './components/VaultLockModal';
import { NotesSidebar } from './components/NotesSidebar';
import { NoteEditor } from './components/NoteEditor';
import { ClipboardDropzone } from './components/ClipboardDropzone';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DeadlineAlertBanner } from './components/DeadlineAlertBanner';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ShareReceiveModal } from './components/ShareReceiveModal';
import { VoiceMemoModal } from './components/VoiceMemoModal';
import { CameraModal } from './components/CameraModal';
import { playClipboardChime } from './lib/sound';
import { FileText, Pin, Calendar, Clipboard, Plus } from 'lucide-react';

export default function App() {
  // Vault & Encryption state (held only in volatile memory)
  const [vaultConfig, setVaultConfig] = useState<VaultConfig | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [isVaultConfigured, setIsVaultConfigured] = useState<boolean>(false);

  // Notes state
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedNoteRecord[]>([]);
  const [decryptedNotes, setDecryptedNotes] = useState<DecryptedNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const [isVoiceMemoOpen, setIsVoiceMemoOpen] = useState(false);
  const [voiceMemoTarget, setVoiceMemoTarget] = useState<'new' | 'current'>('new');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'new' | 'current'>('new');

  const handleOpenCamera = (target: 'new' | 'current' = 'new') => {
    setCameraTarget(target);
    setIsCameraOpen(true);
  };

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cipher_theme');
      if (savedTheme) return savedTheme === 'dark';
      return true; // Dark mode first by default
    }
    return true;
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareReceiveOpen, setIsShareReceiveOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('synced');

  const DEFAULT_PASSPHRASE = 'Cipher2026!';
  const notesRef = useRef<DecryptedNote[]>([]);
  notesRef.current = decryptedNotes;
  const hasInitializedRef = useRef(false);

  // Decrypt notes whenever vaultKey is unlocked or encryptedNotes updates (stable callback, zero deps)
  const refreshDecryptedNotes = useCallback(async (records: EncryptedNoteRecord[], key: CryptoKey) => {
    try {
      const decrypted = await decryptAllNotes(records, key);
      setDecryptedNotes((prevNotes) => {
        // Merge notes so in-memory unsaved or newly captured notes are NEVER clobbered by older storage records
        const map = new Map<string, DecryptedNote>();
        decrypted.forEach((n) => map.set(n.id, n));
        prevNotes.forEach((p) => {
          const stored = map.get(p.id);
          if (!stored || p.updatedAt > stored.updatedAt) {
            map.set(p.id, p);
          }
        });
        return Array.from(map.values()).sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.updatedAt - a.updatedAt;
        });
      });

      setSelectedNoteId((prevId) => {
        if (prevId) return prevId;
        return decrypted[0]?.id || null;
      });
    } catch (err) {
      console.error('Decryption refresh error:', err);
    }
  }, []);

  // Setup vault with new master passphrase
  const handleSetupVault = useCallback(async (passphrase: string) => {
    const { key, config } = await initializeNewVault(passphrase);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cipher_session_pass', passphrase);
    }
    setVaultKey(key);
    setVaultConfig(config);
    setIsVaultConfigured(true);

    // Seed initial welcome notes
    const seededNotes = await seedInitialSampleNotes(key, config.salt);
    const updatedEncrypted = getEncryptedNotes();
    setEncryptedNotes(updatedEncrypted);
    setDecryptedNotes(seededNotes);
    if (seededNotes.length > 0) {
      setSelectedNoteId(seededNotes[0].id);
    }
  }, []);

  // Initialize vault config on initial load and auto-unlock or auto-initialize (runs once on mount)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const config = getVaultConfig();
    const stored = getEncryptedNotes();
    setEncryptedNotes(stored);

    if (config) {
      setVaultConfig(config);
      setIsVaultConfigured(true);

      // Check session or try default passphrase so user is not stuck on a lock screen
      const sessionPass = sessionStorage.getItem('cipher_session_pass') || DEFAULT_PASSPHRASE;
      unlockVaultWithPassphrase(sessionPass).then((key) => {
        if (key) {
          sessionStorage.setItem('cipher_session_pass', sessionPass);
          setVaultKey(key);
          refreshDecryptedNotes(stored, key);
        }
      });
    } else {
      // First run: automatically set up default secure vault so the app opens immediately
      handleSetupVault(DEFAULT_PASSPHRASE);
    }
  }, [handleSetupVault, refreshDecryptedNotes]);

  // Theme synchronization with html class
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('cipher_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cipher_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync across tabs via window storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cipher_sync_channel_v1' || e.key === 'cipher_encrypted_notes_v1') {
        const updated = getEncryptedNotes();
        setEncryptedNotes(updated);
        if (vaultKey) {
          refreshDecryptedNotes(updated, vaultKey);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [vaultKey, refreshDecryptedNotes]);

  // Unlock vault
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    const key = await unlockVaultWithPassphrase(passphrase);
    if (!key) return false;

    sessionStorage.setItem('cipher_session_pass', passphrase);
    setVaultKey(key);
    const stored = getEncryptedNotes();
    setEncryptedNotes(stored);
    await refreshDecryptedNotes(stored, key);

    // Process any shared content received before vault was unlocked
    try {
      const pendingRaw = sessionStorage.getItem('cipher_pending_share');
      if (pendingRaw) {
        sessionStorage.removeItem('cipher_pending_share');
        const parsed = JSON.parse(pendingRaw);
        setTimeout(() => {
          handleProcessIncomingShare(parsed.title || '', parsed.text || '', parsed.url || '');
        }, 150);
      }
    } catch {
      // Ignore
    }

    return true;
  };

  // Lock vault (wipe RAM key & session)
  const handleLockVault = () => {
    sessionStorage.removeItem('cipher_session_pass');
    setVaultKey(null);
    setDecryptedNotes([]);
    setSelectedNoteId(null);
  };

  // Reset vault and immediately reopen with clean default vault
  const handleResetVault = async () => {
    resetVault();
    sessionStorage.removeItem('cipher_session_pass');
    setVaultKey(null);
    setVaultConfig(null);
    setIsVaultConfigured(false);
    setEncryptedNotes([]);
    setDecryptedNotes([]);
    setSelectedNoteId(null);
    await handleSetupVault(DEFAULT_PASSPHRASE);
  };

  // 1-Click Quickstart
  const handleQuickStart = async () => {
    try {
      const key = await unlockVaultWithPassphrase(DEFAULT_PASSPHRASE);
      if (key) {
        sessionStorage.setItem('cipher_session_pass', DEFAULT_PASSPHRASE);
        setVaultKey(key);
        const stored = getEncryptedNotes();
        setEncryptedNotes(stored);
        await refreshDecryptedNotes(stored, key);
        return;
      }
    } catch {
      // Ignore
    }
    await handleResetVault();
  };

  // Persist updated or new notes
  const saveAndSyncNote = async (updatedNote: DecryptedNote) => {
    if (!vaultKey || !vaultConfig) return;

    // Update decrypted list in state using functional updater
    setDecryptedNotes((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === updatedNote.id);
      let newDecryptedList: DecryptedNote[];

      if (existingIndex >= 0) {
        newDecryptedList = [...prev];
        newDecryptedList[existingIndex] = updatedNote;
      } else {
        newDecryptedList = [updatedNote, ...prev];
      }

      return newDecryptedList.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    });

    // Encrypt and save
    try {
      setSyncState('syncing');
      const encryptedRecord = await encryptNotePayload(updatedNote, vaultKey, vaultConfig.salt);
      const existingEncrypted = getEncryptedNotes();
      const encIndex = existingEncrypted.findIndex((r) => r.id === updatedNote.id);

      let newEncryptedList: EncryptedNoteRecord[];
      if (encIndex >= 0) {
        newEncryptedList = [...existingEncrypted];
        newEncryptedList[encIndex] = encryptedRecord;
      } else {
        newEncryptedList = [encryptedRecord, ...existingEncrypted];
      }

      saveEncryptedNotes(newEncryptedList);
      setEncryptedNotes(newEncryptedList);
      setTimeout(() => setSyncState('synced'), 400);
    } catch (err) {
      console.error('Error saving encrypted note:', err);
      setSyncState('error');
    }
  };

  // Create new note
  const handleNewNote = () => {
    if (!vaultKey || !vaultConfig) return;
    const now = Date.now();
    const newNote: DecryptedNote = {
      id: `note-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: 'Neue Notiz',
      content: '',
      tags: [],
      isPinned: false,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      source: 'text',
    };

    saveAndSyncNote(newNote);
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
  };

  // Open standalone Voice Memo modal
  const handleOpenVoiceMemo = (target: 'new' | 'current' = 'new') => {
    setVoiceMemoTarget(target);
    setIsVoiceMemoOpen(true);
  };

  // Save encrypted voice memo attachment from VoiceMemoModal
  const handleSaveVoiceMemoFromModal = (attachment: NoteAttachment) => {
    if (!vaultKey || !vaultConfig) return;
    const now = Date.now();
    const dateStr = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (voiceMemoTarget === 'current' && selectedNoteId) {
      const active = decryptedNotes.find((n) => n.id === selectedNoteId);
      if (active) {
        const updatedAttachments = [...(active.attachments || []), attachment];
        const updatedTags = active.tags?.includes('Sprachmemo')
          ? active.tags
          : [...(active.tags || []), 'Sprachmemo'];
        const updatedNote: DecryptedNote = {
          ...active,
          attachments: updatedAttachments,
          tags: updatedTags,
          updatedAt: now,
        };

        setDecryptedNotes((prev) =>
          prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
        );
        setIsVoiceMemoOpen(false);
        playClipboardChime();
        saveAndSyncNote(updatedNote);
        return;
      }
    }

    // Default or 'new': Create a new note containing the recorded voice memo
    const newNote: DecryptedNote = {
      id: `audio-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: `Sprachmemo vom ${dateStr}`,
      content: '',
      tags: ['Audio', 'Sprachmemo'],
      isPinned: false,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      source: 'audio',
      attachments: [attachment],
    };

    // Synchronously insert new note and select it to guarantee NoteEditor receives it immediately
    setDecryptedNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
    setIsVoiceMemoOpen(false);
    playClipboardChime();

    // Persist encrypted note in background
    saveAndSyncNote(newNote);
  };

  // Capture clipboard text
  const handleCaptureClipboardText = (text: string) => {
    if (!vaultKey || !vaultConfig) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const lines = trimmed.split('\n');
    let title = lines[0].slice(0, 80);
    if (!title) {
      title = `Clipboard-Notiz ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Determine automatic tag if recognizable pattern
    const autoTags: string[] = ['Clipboard'];
    if (/^(http|https):\/\/[^ "]+$/.test(trimmed)) {
      autoTags.push('Link');
    } else if (trimmed.includes('function') || trimmed.includes('const ') || trimmed.includes('{') || trimmed.includes('import ')) {
      autoTags.push('Code');
    }

    const now = Date.now();
    const newNote: DecryptedNote = {
      id: `clip-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      content: trimmed,
      tags: autoTags,
      isPinned: false,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      source: 'clipboard',
    };

    saveAndSyncNote(newNote);
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
  };

  // Process incoming Android Share Target queries or user shared payloads
  const handleProcessIncomingShare = useCallback(
    (title: string, text: string, url: string) => {
      const combinedContent = [text, url].filter(Boolean).join('\n\n');
      const firstLine = text ? text.split('\n')[0].slice(0, 80) : '';
      const noteTitle = title || firstLine || (url ? 'Geteilter Web-Link' : 'Geteilter Inhalt');
      const tags = ['Geteilt', ...(url ? ['Link'] : [])];

      if (vaultKey && vaultConfig) {
        const now = Date.now();
        const newNote: DecryptedNote = {
          id: `share-${now}-${Math.random().toString(36).slice(2, 7)}`,
          title: noteTitle,
          content: combinedContent,
          tags,
          isPinned: false,
          deadline: null,
          createdAt: now,
          updatedAt: now,
          source: 'clipboard',
        };
        saveAndSyncNote(newNote);
        setSelectedNoteId(newNote.id);
        setMobileView('editor');
        playClipboardChime();
      } else {
        try {
          sessionStorage.setItem(
            'cipher_pending_share',
            JSON.stringify({ title: noteTitle, text, url })
          );
        } catch {
          // Ignore
        }
      }
    },
    [vaultKey, vaultConfig]
  );

  // Check for incoming Android Share Target queries in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title') || '';
    const text = params.get('text') || '';
    const url = params.get('url') || '';
    if (title || text || url) {
      handleProcessIncomingShare(title, text, url);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleProcessIncomingShare]);

  // Capture image or audio file dropped or pasted
  const handleCaptureMediaFile = useCallback(
    async (file: File) => {
      if (!vaultKey || !vaultConfig) return;
      const now = Date.now();
      const isImage =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '');

      try {
        let attachment: NoteAttachment;
        if (isImage) {
          const compressed = await compressImage(file, 1280, 0.82);
          attachment = {
            id: `att-${now}-${Math.random().toString(36).slice(2, 7)}`,
            name: compressed.name,
            type: 'image',
            mimeType: compressed.mimeType,
            dataUrl: compressed.dataUrl,
            sizeBytes: compressed.sizeBytes,
            createdAt: now,
          };
        } else {
          const dataUrl = await readFileAsDataUrl(file);
          attachment = {
            id: `att-${now}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name || 'Audio-Aufnahme',
            type: 'audio',
            mimeType: file.type || 'audio/webm',
            dataUrl,
            sizeBytes: file.size,
            createdAt: now,
          };
        }

        const dateStr = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        const defaultTitle = isImage ? `Foto ${dateStr}` : `Sprachmemo ${dateStr}`;

        const newNote: DecryptedNote = {
          id: `media-${now}-${Math.random().toString(36).slice(2, 7)}`,
          title: defaultTitle,
          content: '',
          tags: isImage ? ['Foto', 'Kamera'] : ['Audio', 'Sprachmemo'],
          isPinned: false,
          deadline: null,
          createdAt: now,
          updatedAt: now,
          source: isImage ? 'image' : 'audio',
          attachments: [attachment],
        };

        // Synchronously update state so NoteEditor has it immediately
        setDecryptedNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
        setSelectedNoteId(newNote.id);
        setMobileView('editor');
        playClipboardChime();

        saveAndSyncNote(newNote);
      } catch (err) {
        console.error('Failed to capture media file:', err);
      }
    },
    [vaultKey, vaultConfig, decryptedNotes]
  );

  // Handle photo captured from CameraModal
  const handleSavePhotoFromCamera = (attachment: NoteAttachment) => {
    if (!vaultKey || !vaultConfig) return;
    const now = Date.now();
    const d = new Date();
    const dateStr = `${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} um ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;

    // Target 1: Add to current note if requested and active note exists
    if (cameraTarget === 'current' && selectedNoteId) {
      const active = decryptedNotes.find((n) => n.id === selectedNoteId);
      if (active) {
        const updatedAttachments = [...(active.attachments || []), attachment];
        const updatedTags = active.tags?.includes('Foto')
          ? active.tags
          : [...(active.tags || []), 'Foto'];
        const updatedNote: DecryptedNote = {
          ...active,
          attachments: updatedAttachments,
          tags: updatedTags,
          updatedAt: now,
        };

        setDecryptedNotes((prev) =>
          prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
        );
        setIsCameraOpen(false);
        setMobileView('editor');
        playClipboardChime();

        saveAndSyncNote(updatedNote);
        return;
      }
    }

    // Target 2: Create a brand new note containing the captured photo
    const newNote: DecryptedNote = {
      id: `media-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: `Foto vom ${dateStr}`,
      content: '',
      tags: ['Foto', 'Kamera'],
      isPinned: false,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      source: 'image',
      attachments: [attachment],
    };

    // Synchronously insert new note and select it to guarantee NoteEditor receives it immediately
    setDecryptedNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
    setIsCameraOpen(false);
    playClipboardChime();

    // Persist encrypted note in background
    saveAndSyncNote(newNote);
  };

  // Global window paste handler: capture clipboard (text or images) when user is not typing in a text field
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // If user is focused on an input or textarea, let standard typing/pasting occur
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) {
        return; // Normal paste inside editor
      }

      // Check for image items in clipboard first
      const items = e.clipboardData?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              handleCaptureMediaFile(file);
              return;
            }
          }
        }
      }

      const text = e.clipboardData?.getData('text/plain');
      if (text && text.trim() && vaultKey) {
        e.preventDefault();
        handleCaptureClipboardText(text);
        playClipboardChime();
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [vaultKey, vaultConfig, handleCaptureMediaFile]);

  // Keyboard shortcut listener (/ for search, Alt+N for new note)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || ''))) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="durchsuchen"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vaultKey, vaultConfig]);

  // Toggle pin
  const handleTogglePin = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = decryptedNotes.find((n) => n.id === noteId);
    if (target) {
      saveAndSyncNote({ ...target, isPinned: !target.isPinned, updatedAt: Date.now() });
    }
  };

  // Request note deletion (opens non-blocking in-app confirmation modal)
  const handleDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteIdToDelete(noteId);
  };

  // Perform permanent deletion from decrypted state and encrypted storage
  const handleConfirmDelete = () => {
    if (!noteIdToDelete) return;
    const targetId = noteIdToDelete;

    // Remove from decrypted state and select adjacent note
    setDecryptedNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== targetId);
      if (selectedNoteId === targetId) {
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) {
          setMobileView('list');
        }
      }
      return remaining;
    });

    // Remove directly from persistent encrypted storage
    const stored = getEncryptedNotes();
    const remainingEncrypted = stored.filter((n) => n.id !== targetId);
    saveEncryptedNotes(remainingEncrypted);
    setEncryptedNotes(remainingEncrypted);

    setNoteIdToDelete(null);
  };

  // Clear deadline for a note
  const handleClearDeadline = (noteId: string) => {
    const target = decryptedNotes.find((n) => n.id === noteId);
    if (target) {
      saveAndSyncNote({ ...target, deadline: null, updatedAt: Date.now() });
    }
  };

  // Manual Trigger Sync
  const handleTriggerSync = () => {
    setSyncState('syncing');
    setTimeout(() => {
      const stored = getEncryptedNotes();
      setEncryptedNotes(stored);
      if (vaultKey) {
        refreshDecryptedNotes(stored, vaultKey);
      }
      setSyncState('synced');
    }, 600);
  };

  // Import backup records
  const handleImportBackup = async (importedRecords: EncryptedNoteRecord[]) => {
    if (!vaultKey) return;
    const mergedMap = new Map<string, EncryptedNoteRecord>();
    encryptedNotes.forEach((r) => mergedMap.set(r.id, r));
    importedRecords.forEach((r) => mergedMap.set(r.id, r));

    const combinedList = Array.from(mergedMap.values());
    saveEncryptedNotes(combinedList);
    setEncryptedNotes(combinedList);
    await refreshDecryptedNotes(combinedList, vaultKey);
  };

  const selectedNote = decryptedNotes.find((n) => n.id === selectedNoteId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-900 dark:selection:text-teal-100">
      {/* Top Bar Contract (3 zones) */}
      <TopBar
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onNewNote={handleNewNote}
        onLockVault={handleLockVault}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenShareReceive={() => setIsShareReceiveOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        syncState={syncState}
        notesCount={decryptedNotes.length}
      />

      {/* Deadline Alert Banner */}
      {vaultKey && (
        <DeadlineAlertBanner
          notes={decryptedNotes}
          onSelectNote={(id) => setSelectedNoteId(id)}
          onClearDeadline={handleClearDeadline}
        />
      )}

      {/* Main Responsive Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Quick-Paste Dropzone + Notes Sidebar */}
        <aside
          className={`${
            mobileView === 'list' ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 flex-col h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70`}
        >
          {/* Quick-Paste Dropzone */}
          <div className="p-3 pb-0">
            <ClipboardDropzone
              onCapture={handleCaptureClipboardText}
              onCaptureMedia={handleCaptureMediaFile}
              onStartVoiceMemo={() => handleOpenVoiceMemo('new')}
              onStartCamera={() => handleOpenCamera('new')}
            />
          </div>

          {/* Notes List */}
          <div className="flex-1 min-h-0">
            <NotesSidebar
              notes={decryptedNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={(id) => {
                setSelectedNoteId(id);
                setMobileView('editor');
              }}
              onTogglePin={handleTogglePin}
              onDeleteNote={handleDeleteNote}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onNewNote={handleNewNote}
            />
          </div>
        </aside>

        {/* Right Column: Detail & Editor View */}
        <main
          className={`${
            mobileView === 'editor' ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col h-full min-w-0 bg-white dark:bg-slate-900`}
        >
          <NoteEditor
            note={selectedNote}
            onUpdateNote={saveAndSyncNote}
            onDeleteNote={handleDeleteNote}
            onTogglePin={(id) => handleTogglePin(id)}
            onNewNote={handleNewNote}
            onBackToList={() => {
              setMobileView('list');
            }}
            onStartCamera={() => handleOpenCamera('current')}
            onStartVoiceMemo={() => handleOpenVoiceMemo('current')}
          />
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation */}
      {vaultKey && mobileView === 'list' && (
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 z-20">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-2xs cursor-pointer min-w-[54px] ${
              activeFilter === 'all' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Alle</span>
          </button>
          <button
            onClick={() => setActiveFilter('pinned')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-2xs cursor-pointer min-w-[54px] ${
              activeFilter === 'pinned' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Pin className="w-4 h-4" />
            <span>Gepinnt</span>
          </button>

          {/* Center Floating Action Button */}
          <button
            onClick={handleNewNote}
            className="w-11 h-11 -mt-5 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0"
            title="Neue Notiz erstellen"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveFilter('deadlines')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-2xs cursor-pointer min-w-[54px] ${
              activeFilter === 'deadlines' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Fristen</span>
          </button>
          <button
            onClick={() => setActiveFilter('clipboard')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-2xs cursor-pointer min-w-[54px] ${
              activeFilter === 'clipboard' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>Clips</span>
          </button>
        </div>
      )}

      {/* Vault Master Lock Modal */}
      {!vaultKey && (
        <VaultLockModal
          isConfigured={isVaultConfigured}
          onUnlock={handleUnlockVault}
          onSetup={handleSetupVault}
          onResetVault={handleResetVault}
          onQuickStart={handleQuickStart}
        />
      )}

      {/* Cloud Sync & Backup Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        encryptedNotes={encryptedNotes}
        onImportBackup={handleImportBackup}
        onTriggerSync={handleTriggerSync}
        isSyncing={syncState === 'syncing'}
      />

      {/* Inbound Share Receiver Modal */}
      <ShareReceiveModal
        isOpen={isShareReceiveOpen}
        onClose={() => setIsShareReceiveOpen(false)}
        onReceiveShare={handleProcessIncomingShare}
      />

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!noteIdToDelete}
        noteTitle={decryptedNotes.find((n) => n.id === noteIdToDelete)?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteIdToDelete(null)}
      />

      {/* Voice Memo Recording Modal */}
      <VoiceMemoModal
        isOpen={isVoiceMemoOpen}
        onClose={() => setIsVoiceMemoOpen(false)}
        onSaveAudioMemo={handleSaveVoiceMemoFromModal}
        targetTitle={voiceMemoTarget === 'current' ? selectedNote?.title : null}
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapturePhoto={handleSavePhotoFromCamera}
        targetTitle={cameraTarget === 'current' ? selectedNote?.title : null}
      />
    </div>
  );
}
