import React, { useState } from 'react';
import { Shield, KeyRound, Lock, AlertCircle, ArrowRight, ShieldCheck, Check, Sparkles, RotateCcw } from 'lucide-react';

interface VaultLockModalProps {
  isConfigured: boolean;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onSetup: (passphrase: string) => Promise<void>;
  onResetVault: () => void;
  onQuickStart: () => Promise<void>;
}

export const VaultLockModal: React.FC<VaultLockModalProps> = ({
  isConfigured,
  onUnlock,
  onSetup,
  onResetVault,
  onQuickStart,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Zu kurz', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Schwach', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Mittel', color: 'bg-amber-500' };
    return { score: 3, label: 'Stark (AES-256 bereit)', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(passphrase);

  const handleQuickStartClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await onQuickStart();
    } catch (err) {
      setError('Fehler beim Schnellstart: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase.trim()) {
      setError('Bitte geben Sie ein Master-Passwort ein.');
      return;
    }

    if (!isConfigured) {
      if (passphrase.length < 8) {
        setError('Das Master-Passwort sollte mindestens 8 Zeichen lang sein.');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setError('Die eingegebenen Passwörter stimmen nicht überein.');
        return;
      }

      setLoading(true);
      try {
        await onSetup(passphrase);
      } catch (err) {
        setError('Fehler bei der Initialisierung des Schlüssels: ' + String(err));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const success = await onUnlock(passphrase);
        if (!success) {
          setError('Falsches Master-Passwort. Die Notizen konnten nicht entschlüsselt werden. Nutzen Sie unten „Schnellstart“ oder setzen Sie den Tresor zurück.');
        }
      } catch (err) {
        setError('Entschlüsselungsfehler: ' + String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 shadow-inner">
            {isConfigured ? <Lock className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            {isConfigured ? 'CipherNote Tresor gesperrt' : 'Willkommen bei CipherNote'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {isConfigured
              ? 'Geben Sie Ihr Master-Passwort ein oder öffnen Sie die App mit 1-Klick.'
              : 'End-to-End-verschlüsselte Notiz- & Clipboard-Zentrale mit AES-256-GCM.'}
          </p>
        </div>

        {/* 1-Click Quickstart Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleQuickStartClick}
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>App sofort öffnen (1-Klick Schnellstart)</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-1.5">
            Startet sofort mit verschlüsselten Beispieldaten & bleibt im Tab geöffnet
          </p>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 text-2xs font-medium text-slate-400 bg-white dark:bg-slate-900">
            {isConfigured ? 'oder manuell mit Passwort entsperren' : 'oder eigenes Master-Passwort vergeben'}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isConfigured ? 'Master-Passwort' : 'Neues Master-Passwort'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {!isConfigured && passphrase.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Passwortstärke:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                </div>
              </div>
            )}
          </div>

          {!isConfigured && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Passwort bestätigen
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Wird verifiziert...</span>
            ) : isConfigured ? (
              <>
                <span>Tresor entsperren</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-teal-500" />
                <span>Tresor mit Passwort sichern</span>
              </>
            )}
          </button>
        </form>

        {isConfigured && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            {showResetConfirm ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-700 dark:text-rose-400 space-y-2">
                <p className="font-medium">Möchten Sie den Tresor zurücksetzen und sofort mit den Beispiel-Notizen neu starten?</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={onResetVault}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Ja, zurücksetzen & öffnen
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-2xs text-slate-400 hover:text-rose-500 transition-colors underline cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Passwort vergessen? Tresor zurücksetzen & neu starten</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
