import React from 'react';
import { Shield, Plus, Lock, Moon, Sun, Cloud, RefreshCw, Share2, Download, KeyRound } from 'lucide-react';
import { FilterOption, SyncState } from '../types';

interface TopBarProps {
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
  onNewNote: () => void;
  onLockVault: () => void;
  onOpenSync: () => void;
  onOpenShareReceive: () => void;
  onOpenInstall?: () => void;
  onOpenSecurity?: () => void;
  isInstallable?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  syncState: SyncState;
  notesCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeFilter,
  onSelectFilter,
  onNewNote,
  onLockVault,
  onOpenSync,
  onOpenShareReceive,
  onOpenInstall,
  onOpenSecurity,
  isInstallable = false,
  isDarkMode,
  onToggleTheme,
  syncState,
}) => {
  return (
    <header className="flex items-center justify-between gap-1.5 sm:gap-6 px-2.5 sm:px-6 py-2 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors max-w-full">
      {/* Zone 1: Brand wordmark (single element, clean display) */}
      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          CipherNote
        </span>
      </div>

      {/* Zone 2: Single-line navigation and filter links */}
      <nav className="hidden md:flex items-center gap-2 text-xs font-medium">
        <button
          onClick={() => onSelectFilter('all')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeFilter === 'all'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Alle Notizen
        </button>
        <button
          onClick={() => onSelectFilter('pinned')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeFilter === 'pinned'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Gepinnt
        </button>
        <button
          onClick={() => onSelectFilter('deadlines')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeFilter === 'deadlines'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Deadlines & Fristen
        </button>
        <button
          onClick={() => onSelectFilter('clipboard')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeFilter === 'clipboard'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Zwischenablage
        </button>
      </nav>

      {/* Zone 3: Primary Action Button + Secondary Utilities */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {isInstallable && (
          <>
            <button
              onClick={onOpenInstall}
              className="p-1.5 sm:p-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center border border-teal-500/20 active:scale-95"
              title="CipherNote als App installieren"
              aria-label="CipherNote als App installieren"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
          </>
        )}

        <button
          onClick={onNewNote}
          className="flex items-center gap-1 px-2 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-97 min-h-[32px] sm:min-h-[36px]"
          title="Neue Notiz anlegen (Alt + N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Neue Notiz</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Cloud Sync trigger */}
        <button
          onClick={onOpenSync}
          className="p-1.5 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          title="Cloud-Synchronisation & Backups"
        >
          {syncState === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-teal-500" />
          ) : (
            <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

        {/* Inbound Share trigger (hidden on small mobile screens to keep the bar compact) */}
        <button
          onClick={onOpenShareReceive}
          className="hidden sm:flex p-1.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer min-h-[36px] min-w-[36px] items-center justify-center"
          title="Inhalt per Teilen empfangen / simulieren"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          title={isDarkMode ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Security / Master Password modal trigger */}
        {onOpenSecurity && (
          <button
            onClick={onOpenSecurity}
            className="p-1.5 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            title="Tresor-Sicherheit: Master-Passwort vergeben oder ändern"
          >
            <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Lock Vault (Schloss-Symbol) - Distinctly styled and guaranteed visible */}
        <button
          onClick={onLockVault}
          className="p-1.5 sm:p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0 active:scale-95"
          title="Tresor sperren (Daten im RAM löschen)"
        >
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};
