import React, { useState, useMemo, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  X,
  Smartphone,
  Copy,
  Check,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { EncryptedNoteRecord } from '../types';
import { generateQRCodeSVG } from '../lib/qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DEV_APP_URL = 'https://ais-dev-zcrzmpjjrtgovqwbmmabbm-582512883851.europe-west3.run.app';
const SHARED_APP_URL = 'https://ais-pre-zcrzmpjjrtgovqwbmmabbm-582512883851.europe-west3.run.app';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptedNotes: EncryptedNoteRecord[];
  onImportBackup: (importedNotes: EncryptedNoteRecord[]) => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  encryptedNotes,
  onImportBackup,
  onTriggerSync,
  isSyncing,
}) => {
  const [copyPairCode, setCopyPairCode] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState<'current' | 'share'>('current');
  const { isInstallable, install } = usePWAInstall();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine current origin and environment
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : DEV_APP_URL;
  const isAiStudio = typeof window !== 'undefined' && window.location.hostname.includes('europe-west3.run.app');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const appUrl = (isAiStudio && urlMode === 'share') ? SHARED_APP_URL : currentOrigin;

  // Instant synchronous SVG generation without promises or canvas delays
  const qrSvg = useMemo(() => generateQRCodeSVG(appUrl, 3), [appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopyLinkFeedback(true);
    setTimeout(() => setCopyLinkFeedback(false), 2000);
  };

  const pairCode = `CIPHER-${Math.abs(
    encryptedNotes.reduce((acc, curr) => acc + curr.ciphertext.length, 42)
  ).toString(36).toUpperCase()}-SYNC`;

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notesCount: encryptedNotes.length,
      encryptedRecords: encryptedNotes,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphervault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.encryptedRecords)) {
          onImportBackup(parsed.encryptedRecords);
          setImportStatus(`${parsed.encryptedRecords.length} verschlüsselte Notizen erfolgreich importiert.`);
        } else if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          setImportStatus(`${parsed.length} Notizen importiert.`);
        } else {
          setImportStatus('Ungültiges Backup-Format.');
        }
      } catch {
        setImportStatus('Fehler beim Lesen der Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPair = () => {
    navigator.clipboard.writeText(pairCode);
    setCopyPairCode(true);
    setTimeout(() => setCopyPairCode(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Prominent Close Button */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Geräte- & Cloud-Synchronisation
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Ende-zu-Ende verschlüsselte Synchronisation & Smartphone-App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Fenster schließen"
          >
            <span>Schließen</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Sync Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Synchronisationsstatus: Aktiv
                </span>
              </div>
              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 text-2xs font-medium text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisiert...' : 'Jetzt abgleichen'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-2xs">
              <div>
                <span className="text-slate-400">Gespeicherte Notizen:</span>
                <span className="ml-1 font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {encryptedNotes.length}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Verschlüsselung:</span>
                <span className="ml-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  AES-GCM 256-Bit
                </span>
              </div>
            </div>
          </div>

          {/* Smartphone Install & QR Code Section */}
          <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Auf dem Smartphone öffnen & installieren</span>
              </h4>
              <span className="text-2xs text-teal-700 dark:text-teal-400 font-semibold bg-teal-100/70 dark:bg-teal-900/50 px-2 py-0.5 rounded">
                PWA / Mobile Web
              </span>
            </div>

            {/* URL Mode Switcher Tabs (Only relevant in AI Studio) */}
            {isAiStudio && (
              <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-2xs font-medium">
                <button
                  type="button"
                  onClick={() => setUrlMode('current')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                    urlMode === 'current'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  1. Aktuelle Live-Instanz (ais-dev)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlMode('share')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                    urlMode === 'share'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  2. Freigabe-Link (ais-pre)
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Scannable QR Code */}
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <div
                  className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1">
                  Kamera-App darauf richten
                </span>
              </div>

              <div className="space-y-2.5 flex-1 text-xs">
                <div className="p-2 bg-white/80 dark:bg-slate-900/80 border border-teal-200/50 dark:border-teal-800/50 rounded-lg space-y-1">
                  <p className="text-2xs font-semibold text-teal-900 dark:text-teal-200">
                    {isAiStudio
                      ? (urlMode === 'current' ? 'Aktuelle Entwicklungs-URL:' : 'Öffentliche Freigabe-URL:')
                      : 'Anwendungs-URL für Mobilgeräte:'}
                  </p>
                  <code className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all block select-all">
                    {appUrl}
                  </code>
                </div>

                {isAiStudio ? (
                  urlMode === 'current' ? (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-2xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <strong>Wichtig für die Live-Instanz:</strong> Ihr Handy-Browser muss mit demselben Google-Konto wie AI Studio angemeldet sein.
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-2xs text-blue-900 dark:text-blue-200 leading-relaxed">
                      <strong>Wichtig für den Freigabe-Link:</strong> Wird aktiv, sobald Sie oben rechts in AI Studio auf <strong>„Share“ (Teilen)</strong> geklickt haben.
                    </div>
                  )
                ) : isLocalhost ? (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-2xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>Hinweis zu localhost:</strong> Damit Ihr Handy den Server im selben WLAN erreicht, rufen Sie die App am PC über Ihre Netzwerk-IP auf (z. B. <code>http://192.168.x.x:3000</code>).
                  </div>
                ) : null}

                <p className="text-2xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  1. Link auf dem Handy öffnen.<br />
                  2. Im Browser das Menü (<strong>⋮</strong> oder Teilen) öffnen.<br />
                  3. <strong>„App installieren“</strong> (oder <strong>„Zum Startbildschirm hinzufügen“</strong>) wählen.
                </p>

                {isInstallable && (
                  <button
                    onClick={install}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>App jetzt direkt installieren</span>
                  </button>
                )}

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-2xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
                  >
                    {copyLinkFeedback ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copyLinkFeedback ? 'Link kopiert!' : 'Link kopieren'}</span>
                  </button>
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-2xs text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Im neuen Tab</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Device Pairing Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-teal-500" />
              <span>Geräte-Pairing & Live-Sync</span>
            </h4>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
              Auf einem zweiten Gerät können Sie mit demselben Master-Passwort und diesem Kopplungscode alle Notizen synchronisieren.
            </p>

            <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <code className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                {pairCode}
              </code>
              <button
                onClick={handleCopyPair}
                className="flex items-center gap-1 px-2 py-1 text-2xs text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {copyPairCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copyPairCode ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>
          </div>

          {/* Encrypted Backup Export & Import */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Verschlüsseltes Tresor-Backup (Offline & Cloud-Transfer)
            </h4>

            {importStatus && (
              <p className="text-2xs p-2 bg-teal-500/10 text-teal-700 dark:text-teal-300 rounded border border-teal-500/20">
                {importStatus}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-500" />
                <span>Backup exportieren</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-teal-500" />
                <span>Backup importieren</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Sticky Footer with prominent "Zurück zur App" button */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
          <p className="text-2xs text-slate-400">
            Kryptografisch gesichert mit AES-256-GCM
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Fertig / Zurück zur App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
