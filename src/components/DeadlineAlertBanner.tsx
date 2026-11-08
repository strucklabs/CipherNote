import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Bell, X, Check } from 'lucide-react';
import { DecryptedNote } from '../types';
import { playDeadlineAlarmChime } from '../lib/sound';

interface DeadlineAlertBannerProps {
  notes: DecryptedNote[];
  onSelectNote: (id: string) => void;
  onClearDeadline: (id: string) => void;
}

export const DeadlineAlertBanner: React.FC<DeadlineAlertBannerProps> = ({
  notes,
  onSelectNote,
  onClearDeadline,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hasNotifiedIds, setHasNotifiedIds] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Filter notes that have an active deadline
  const urgentNotes = notes.filter((note) => {
    if (!note.deadline || dismissedIds.includes(note.id)) return false;
    const deadlineTime = new Date(note.deadline).getTime();
    const now = Date.now();
    const diffMinutes = Math.floor((deadlineTime - now) / 60000);
    // Alert if overdue or due within 60 minutes
    return diffMinutes <= 60;
  });

  // Check deadlines every 30 seconds
  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      urgentNotes.forEach((note) => {
        if (!note.deadline) return;
        const deadlineTime = new Date(note.deadline).getTime();
        // If triggered in this minute and not yet notified
        if (deadlineTime <= now && !hasNotifiedIds.includes(note.id)) {
          setHasNotifiedIds((prev) => [...prev, note.id]);
          playDeadlineAlarmChime();

          // Native browser notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`CipherNote Frist fällig!`, {
                body: `Die Notiz "${note.title || 'Ohne Titel'}" hat ihren Fälligkeitstermin erreicht.`,
                icon: '/favicon.ico',
              });
            } catch {
              // Ignore notification failure in sandbox
            }
          }
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30_000);
    return () => clearInterval(interval);
  }, [urgentNotes, hasNotifiedIds]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch {
        // Ignore permission failure
      }
    }
  };

  if (urgentNotes.length === 0) return null;

  const currentAlertNote = urgentNotes[0];
  const deadlineDate = new Date(currentAlertNote.deadline!);
  const isOverdue = deadlineDate.getTime() < Date.now();

  const handleSnooze = (noteId: string) => {
    setDismissedIds((prev) => [...prev, noteId]);
  };

  return (
    <div
      className={`px-6 py-2.5 flex items-center justify-between gap-4 text-xs transition-colors border-b ${
        isOverdue
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isOverdue ? (
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}

        <div className="flex items-center gap-2 truncate">
          <span className="font-bold whitespace-nowrap">
            {isOverdue ? 'Überfällige Frist:' : 'Anstehende Frist:'}
          </span>
          <button
            onClick={() => onSelectNote(currentAlertNote.id)}
            className="font-medium underline truncate hover:opacity-80 text-left cursor-pointer"
          >
            "{currentAlertNote.title || 'Ohne Titel'}"
          </button>
          <span className="font-mono tabular-nums text-2xs opacity-90 hidden sm:inline">
            ({deadlineDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {notificationPermission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            onClick={requestNotificationPermission}
            className="flex items-center gap-1 px-2 py-0.5 text-2xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Desktop-Benachrichtigungen für Fristen aktivieren"
          >
            <Bell className="w-3 h-3 text-teal-500" />
            <span className="hidden md:inline">Desktop-Alarme erlauben</span>
          </button>
        )}

        <button
          onClick={() => onClearDeadline(currentAlertNote.id)}
          className="flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold rounded bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
        >
          <Check className="w-3 h-3" />
          <span>Erledigt</span>
        </button>

        <button
          onClick={() => handleSnooze(currentAlertNote.id)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
          title="Erinnerung schließen"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
