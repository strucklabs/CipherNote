import React from 'react';
import { Shield, Plus, Lock, Moon, Sun, Cloud, RefreshCw, Share2, Download } from 'lucide-react';
import { FilterOption, SyncState } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
  onNewNote: () => void;
  onLockVault: () => void;
  onOpenSync: () => void;
  onOpenShareReceive: () => void;
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
  isDarkMode,
  onToggleTheme,
  syncState,
}) => {
  const { isInstallable, install } = usePWAInstall();
  return (
    <header className="flex items-center justify-between gap-3 sm:gap-8 px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Zone 1: Brand wordmark (single element, clean display) */}
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
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
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 cursor-pointer transition-colors shadow-xs min-h-[36px]"
            title="CipherNote als App installieren"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="hidden sm:inline">App installieren</span>
          </button>
        )}

        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-97 min-h-[36px]"
          title="Neue Notiz anlegen (Alt + N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Neue Notiz</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Cloud Sync trigger */}
        <button
          onClick={onOpenSync}
          className="p-2 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Cloud-Synchronisation & Backups"
        >
          {syncState === 'syncing' ? (
            <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
        </button>

        {/* Inbound Share trigger */}
        <button
          onClick={onOpenShareReceive}
          className="p-2 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Inhalt per Teilen empfangen / simulieren"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title={isDarkMode ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Lock Vault */}
        <button
          onClick={onLockVault}
          className="p-2 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Tresor sperren (Daten im RAM löschen)"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
