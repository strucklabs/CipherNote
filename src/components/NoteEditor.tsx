import React, { useState, useEffect, useRef } from 'react';
import {
  Pin,
  Calendar,
  Clock,
  Copy,
  Download,
  Trash2,
  Check,
  Tag,
  Plus,
  X,
  Eye,
  Edit3,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  Music,
} from 'lucide-react';
import { DecryptedNote, NoteAttachment } from '../types';
import { canNativeShare, shareNoteViaNative } from '../lib/platform';
import { compressImage, readFileAsDataUrl } from '../lib/media';
import { NoteAttachmentsView } from './NoteAttachmentsView';

interface NoteEditorProps {
  note: DecryptedNote | null;
  onUpdateNote: (updated: DecryptedNote) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onNewNote: () => void;
  onBackToList?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onNewNote,
  onBackToList,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setDeadline(note.deadline);
      setTags(note.tags || []);
      setAttachments(note.attachments || []);
      setPreviewMode(false);
    }
  }, [note?.id]);

  const handleAddAttachment = (newAtt: NoteAttachment) => {
    const updated = [...attachments, newAtt];
    setAttachments(updated);
    if (note) {
      onUpdateNote({ ...note, attachments: updated, updatedAt: Date.now() });
    }
  };

  const handleRemoveAttachment = (id: string) => {
    const updated = attachments.filter((a) => a.id !== id);
    setAttachments(updated);
    if (note) {
      onUpdateNote({ ...note, attachments: updated, updatedAt: Date.now() });
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        handleAddAttachment({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: compressed.name,
          type: 'image',
          mimeType: compressed.mimeType,
          dataUrl: compressed.dataUrl,
          sizeBytes: compressed.sizeBytes,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file);
        handleAddAttachment({
          id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: 'audio',
          mimeType: file.type || 'audio/mpeg',
          dataUrl,
          sizeBytes: file.size,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handlePasteMedia = async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const audioFiles = files.filter((f) => f.type.startsWith('audio/'));

    if (imageFiles.length > 0 || audioFiles.length > 0) {
      e.preventDefault();
      setIsProcessingMedia(true);
      try {
        for (const file of imageFiles) {
          const compressed = await compressImage(file);
          handleAddAttachment({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `Screenshot ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}.webp`,
            type: 'image',
            mimeType: compressed.mimeType,
            dataUrl: compressed.dataUrl,
            sizeBytes: compressed.sizeBytes,
            createdAt: Date.now(),
          });
        }
        for (const file of audioFiles) {
          const dataUrl = await readFileAsDataUrl(file);
          handleAddAttachment({
            id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: 'audio',
            mimeType: file.type,
            dataUrl,
            sizeBytes: file.size,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error pasting media:', err);
      } finally {
        setIsProcessingMedia(false);
      }
    }
  };

  const handleDropMedia = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const audioFiles = files.filter((f) => f.type.startsWith('audio/'));

    if (imageFiles.length > 0 || audioFiles.length > 0) {
      e.preventDefault();
      setIsProcessingMedia(true);
      try {
        for (const file of imageFiles) {
          const compressed = await compressImage(file);
          handleAddAttachment({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: compressed.name,
            type: 'image',
            mimeType: compressed.mimeType,
            dataUrl: compressed.dataUrl,
            sizeBytes: compressed.sizeBytes,
            createdAt: Date.now(),
          });
        }
        for (const file of audioFiles) {
          const dataUrl = await readFileAsDataUrl(file);
          handleAddAttachment({
            id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: 'audio',
            mimeType: file.type,
            dataUrl,
            sizeBytes: file.size,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error dropping media:', err);
      } finally {
        setIsProcessingMedia(false);
      }
    }
  };

  // Handle immediate change & propagate
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (note) {
      onUpdateNote({ ...note, title: newTitle, updatedAt: Date.now() });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (note) {
      onUpdateNote({ ...note, content: newContent, updatedAt: Date.now() });
    }
  };

  const handleDeadlineChange = (newDeadline: string | null) => {
    setDeadline(newDeadline);
    setShowDatePicker(false);
    if (note) {
      onUpdateNote({ ...note, deadline: newDeadline, updatedAt: Date.now() });
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const updatedTags = [...tags, trimmed];
      setTags(updatedTags);
      setNewTagInput('');
      setShowTagInput(false);
      if (note) {
        onUpdateNote({ ...note, tags: updatedTags, updatedAt: Date.now() });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    if (note) {
      onUpdateNote({ ...note, tags: updatedTags, updatedAt: Date.now() });
    }
  };

  const handleCopyNote = async () => {
    if (!note) return;
    try {
      const fullText = `${title}\n\n${content}`;
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (!note) return;
    if (canNativeShare()) {
      await shareNoteViaNative(title, content);
    } else {
      handleCopyNote();
    }
  };

  const handleExportNote = (format: 'md' | 'txt' | 'json') => {
    if (!note) return;
    let data = '';
    let filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'notiz'}.${format}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      data = JSON.stringify(note, null, 2);
      mimeType = 'application/json';
    } else if (format === 'md') {
      data = `# ${title}\n\n${content}\n\n---\n*Erstellt: ${new Date(note.createdAt).toLocaleString()}*`;
      mimeType = 'text/markdown';
    } else {
      data = `${title}\n\n${content}`;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick deadline presets
  const setPresetDeadline = (hoursAhead: number, targetHour?: number) => {
    const d = new Date();
    if (targetHour !== undefined) {
      d.setDate(d.getDate() + (hoursAhead >= 24 ? Math.floor(hoursAhead / 24) : 0));
      d.setHours(targetHour, 0, 0, 0);
    } else {
      d.setTime(d.getTime() + hoursAhead * 3600_000);
    }
    handleDeadlineChange(d.toISOString());
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 shadow-inner">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Keine Notiz ausgewählt
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Wählen Sie eine Notiz aus der linken Spalte aus oder erfassen Sie neue Inhalte per Tastatur und Zwischenablage.
        </p>
        <button
          onClick={onNewNote}
          className="mt-5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Neue Notiz erstellen
        </button>
      </div>
    );
  }

  // Statistics
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  // Deadline calculation
  const deadlineDate = deadline ? new Date(deadline) : null;
  const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
  const timeRemainingMinutes = deadlineDate ? Math.floor((deadlineDate.getTime() - Date.now()) / 60000) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
        {/* Left: Mobile Back Button + Tags and Source info */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-md transition-colors cursor-pointer shrink-0"
              title="Zurück zur Liste"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zurück</span>
            </button>
          )}

          <button
            onClick={() => onTogglePin(note.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
              note.isPinned
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-current' : ''}`} />
            <span>{note.isPinned ? 'Gepinnt' : 'Anpinnen'}</span>
          </button>

          {/* Tags */}
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-2xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 rounded px-1.5 py-0.5"
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Tag..."
                autoFocus
                className="w-20 px-1.5 py-0.5 text-2xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
              <button
                onClick={handleAddTag}
                className="text-2xs text-teal-600 hover:text-teal-500 font-semibold cursor-pointer"
              >
                OK
              </button>
              <button
                onClick={() => setShowTagInput(false)}
                className="text-2xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 text-2xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Tag</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Deadline Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                deadline
                  ? isOverdue
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Frist festlegen"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {deadline ? (isOverdue ? 'Frist abgelaufen' : 'Frist aktiv') : 'Frist'}
              </span>
            </button>

            {/* Datepicker Popover */}
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <span>Fälligkeitsdatum setzen</span>
                  {deadline && (
                    <button
                      onClick={() => handleDeadlineChange(null)}
                      className="text-2xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Frist entfernen
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="datetime-local"
                    value={
                      deadline
                        ? new Date(new Date(deadline).getTime() - new Date().getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDeadlineChange(new Date(e.target.value).toISOString());
                      }
                    }}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <div className="text-2xs text-slate-400 font-medium">Schnellauswahl:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-2xs">
                    <button
                      onClick={() => setPresetDeadline(0, 20)}
                      className="p-1.5 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Heute 20:00
                    </button>
                    <button
                      onClick={() => setPresetDeadline(24, 9)}
                      className="p-1.5 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Morgen 09:00
                    </button>
                    <button
                      onClick={() => setPresetDeadline(72)}
                      className="p-1.5 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      In 3 Tagen
                    </button>
                    <button
                      onClick={() => setPresetDeadline(168)}
                      className="p-1.5 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Nächste Woche
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Pickers */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleAudioSelect}
          />

          {/* Add Image Button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
            title="Bild einfügen oder Foto aufnehmen"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </button>

          {/* Audio File Button */}
          <button
            onClick={() => audioInputRef.current?.click()}
            className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Audiodatei anhängen"
          >
            <Music className="w-3.5 h-3.5 text-rose-500" />
          </button>

          {/* Preview / Edit Toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
              previewMode
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={previewMode ? 'Editor bearbeiten' : 'Markdown-Vorschau'}
          >
            {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Copy content */}
          <button
            onClick={handleCopyNote}
            className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer relative"
            title="In Zwischenablage kopieren"
          >
            {copyFeedback ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Native Share button */}
          <button
            onClick={handleShare}
            className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
            title="Notiz teilen (Android Share Sheet / Messenger)"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button
              onClick={() => handleExportNote('md')}
              className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Notiz exportieren (.md)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete note */}
          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Notiz löschen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Deadline Alert Banner if applicable */}
      {deadline && (
        <div
          className={`flex items-center justify-between px-6 py-2 text-xs border-b ${
            isOverdue
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOverdue ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Clock className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-semibold">
              {isOverdue ? 'Diese Frist ist überfällig:' : 'Erinnerung / Fälligkeit:'}
            </span>
            <span className="font-mono tabular-nums">
              {deadlineDate?.toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {timeRemainingMinutes !== null && !isOverdue && (
              <span className="text-2xs opacity-80">
                (noch {Math.floor(timeRemainingMinutes / 60)}h {timeRemainingMinutes % 60}m)
              </span>
            )}
          </div>
          <button
            onClick={() => handleDeadlineChange(null)}
            className="text-2xs hover:underline cursor-pointer"
          >
            Als erledigt markieren
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div
        className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4"
        onDrop={handleDropMedia}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Titel der Notiz..."
          className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent border-none focus:outline-hidden font-sans"
        />

        {/* Processing Indicator */}
        {isProcessingMedia && (
          <div className="p-2 text-2xs bg-teal-500/10 text-teal-700 dark:text-teal-300 rounded-lg animate-pulse flex items-center gap-1.5 font-medium">
            <span>Medium wird verarbeitet & Ende-zu-Ende verschlüsselt...</span>
          </div>
        )}

        {/* Content Area or Preview */}
        {previewMode ? (
          <div className="flex-1 prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans select-text">
            {content || <span className="text-slate-400 italic">Kein Text vorhanden.</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onPaste={handlePasteMedia}
            placeholder="Schreiben Sie hier, fügen Sie Screenshots per Strg+V ein oder ziehen Sie Bilder & Sprachmemos hierher..."
            className="flex-1 w-full bg-transparent border-none resize-none focus:outline-hidden text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 leading-relaxed font-sans min-h-[140px]"
          />
        )}

        {/* Encrypted Attachments View (Images & Audio Memos) */}
        <NoteAttachmentsView
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
          readOnly={previewMode}
        />
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 text-2xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums">{charCount} Zeichen</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{wordCount} Wörter</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{lineCount} Zeilen</span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Zuletzt gespeichert:{' '}
            <span className="font-mono tabular-nums">
              {new Date(note.updatedAt).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-teal-600 dark:text-teal-400">
            {note.source === 'clipboard' ? 'Aus Zwischenablage' : 'Manuell verfasst'}
          </span>
        </div>
      </div>
    </div>
  );
};
