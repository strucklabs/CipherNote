import React from 'react';
import { Search, Pin, Calendar, Clipboard, FileText, Trash2, X, Clock } from 'lucide-react';
import { DecryptedNote, FilterOption } from '../types';
import { isMobileDevice } from '../lib/platform';

interface NotesSidebarProps {
  notes: DecryptedNote[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onNewNote: () => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onTogglePin,
  onDeleteNote,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onNewNote,
}) => {
  const isMobile = isMobileDevice();
  // Filter notes by search query and category
  const filteredNotes = notes.filter((note) => {
    // Category filter
    if (activeFilter === 'pinned' && !note.isPinned) return false;
    if (activeFilter === 'deadlines' && !note.deadline) return false;
    if (activeFilter === 'clipboard' && note.source !== 'clipboard') return false;

    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = note.title.toLowerCase().includes(q);
    const contentMatch = note.content.toLowerCase().includes(q);
    const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const chronologicalNotes = filteredNotes.filter((n) => !n.isPinned);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes}m`;
    if (hours < 24) return `vor ${hours}h`;
    if (days < 7) return `vor ${days}d`;
    return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getDeadlineStatus = (deadlineIso: string | null) => {
    if (!deadlineIso) return null;
    const deadlineTime = new Date(deadlineIso).getTime();
    const now = Date.now();
    const diff = deadlineTime - now;

    if (diff < 0) {
      return {
        label: 'Überfällig',
        color: 'text-rose-600 dark:text-rose-400 font-semibold',
        bg: 'bg-rose-500/10',
      };
    }
    const hours = Math.floor(diff / 3600000);
    if (hours <= 24) {
      return {
        label: `In ${hours} Std.`,
        color: 'text-amber-600 dark:text-amber-400 font-medium',
        bg: 'bg-amber-500/10',
      };
    }
    const days = Math.floor(diff / 86400000);
    return {
      label: `In ${days} Tagen`,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
    };
  };

  const renderNoteCard = (note: DecryptedNote) => {
    const isSelected = note.id === selectedNoteId;
    const deadlineStatus = getDeadlineStatus(note.deadline);
    const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
    const firstImage = note.attachments?.find((a) => a.type === 'image');
    const imageCount = note.attachments?.filter((a) => a.type === 'image').length || 0;
    const audioCount = note.attachments?.filter((a) => a.type === 'audio').length || 0;

    return (
      <div
        key={note.id}
        onClick={() => onSelectNote(note.id)}
        className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none min-h-[58px] ${
          isSelected
            ? 'bg-white dark:bg-slate-800/90 border-teal-500/80 dark:border-teal-400/80 shadow-md ring-1 ring-teal-500/20'
            : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {imageCount > 0 ? (
              <span title={`${imageCount} Bild(er) angehängt`}>
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            ) : audioCount > 0 ? (
              <span title={`${audioCount} Audioaufnahme(n)`}>
                <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
            ) : note.source === 'clipboard' ? (
              <Clipboard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {note.title || 'Ohne Titel'}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-90 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => onTogglePin(note.id, e)}
              className={`p-1.5 rounded-md transition-colors min-w-[30px] min-h-[30px] flex items-center justify-center ${
                note.isPinned
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={note.isPinned ? 'Notiz loslösen' : 'Notiz oben anpinnen'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => onDeleteNote(note.id, e)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors min-w-[30px] min-h-[30px] flex items-center justify-center"
              title="Notiz löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content snippet and optional image preview */}
        <div className="flex items-center gap-2 mt-1.5">
          <p className="flex-1 text-2xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">
            {note.content || (note.attachments && note.attachments.length > 0 ? `[${note.attachments.length} Anhang/Anhänge]` : 'Kein zusätzlicher Text')}
          </p>
          {firstImage && (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <img
                src={firstImage.dataUrl}
                alt={firstImage.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Clean zero-pill metadata row */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-2xs text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums">{formatTimestamp(note.updatedAt)}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-mono tabular-nums">{wordCount} Wörter</span>

          {imageCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{imageCount}</span>
              </span>
            </>
          )}

          {audioCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-mono">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>{audioCount}</span>
              </span>
            </>
          )}

          {deadlineStatus && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className={`inline-flex items-center gap-1 ${deadlineStatus.color}`}>
                <Clock className="w-3 h-3" />
                <span>{deadlineStatus.label}</span>
              </span>
            </>
          )}

          {note.tags.length > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="truncate max-w-[100px] text-teal-600/80 dark:text-teal-400/80">
                #{note.tags[0]}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800">
      {/* Search & Filter Header */}
      <div className="p-3 sm:p-4 space-y-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isMobile ? 'Notizen durchsuchen...' : 'Notizen durchsuchen... (/)'}
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-900/80 rounded-lg text-2xs font-medium">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex-1 py-1 rounded-md text-center transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Alle ({notes.length})
          </button>
          <button
            onClick={() => onFilterChange('pinned')}
            className={`flex-1 py-1 rounded-md text-center transition-all flex items-center justify-center gap-1 ${
              activeFilter === 'pinned'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Pin className="w-2.5 h-2.5" />
            <span>Gepinnt</span>
          </button>
          <button
            onClick={() => onFilterChange('deadlines')}
            className={`flex-1 py-1 rounded-md text-center transition-all flex items-center justify-center gap-1 ${
              activeFilter === 'deadlines'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-2.5 h-2.5" />
            <span>Fristen</span>
          </button>
          <button
            onClick={() => onFilterChange('clipboard')}
            className={`flex-1 py-1 rounded-md text-center transition-all flex items-center justify-center gap-1 ${
              activeFilter === 'clipboard'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-2.5 h-2.5" />
            <span>Clips</span>
          </button>
        </div>
      </div>

      {/* Notes List with Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {searchQuery ? 'Keine passenden Notizen gefunden' : 'Noch keine Notizen vorhanden'}
            </p>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
              {searchQuery
                ? 'Versuchen Sie einen anderen Suchbegriff oder löschen Sie den Filter.'
                : isMobile
                ? 'Tippen Sie auf „Aus Zwischenablage erfassen“ oder teilen Sie Inhalte an CipherNote.'
                : 'Kopieren Sie Text per Strg+V oder erstellen Sie eine neue Notiz.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewNote}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Erste Notiz anlegen
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 text-2xs font-semibold tracking-wider text-slate-400 uppercase">
                  <Pin className="w-2.5 h-2.5 text-teal-500" />
                  <span>Gepinnt ({pinnedNotes.length})</span>
                </div>
                <div className="space-y-2">{pinnedNotes.map(renderNoteCard)}</div>
              </div>
            )}

            {/* Chronological Section */}
            {chronologicalNotes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 text-2xs font-semibold tracking-wider text-slate-400 uppercase">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {pinnedNotes.length > 0 ? `Chronologisch (${chronologicalNotes.length})` : `Notizen (${chronologicalNotes.length})`}
                  </span>
                </div>
                <div className="space-y-2">{chronologicalNotes.map(renderNoteCard)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
