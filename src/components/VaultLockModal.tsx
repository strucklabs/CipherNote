import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { isWebCryptoAvailable } from '../lib/crypto';

interface VaultLockModalProps {
  isConfigured: boolean;
  isUsingDefaultPassword?: boolean;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onSetup: (passphrase: string) => Promise<void>;
  onResetVault: () => void;
  onQuickStart: () => Promise<void>;
  isInstallable?: boolean;
  onOpenInstall?: () => void;
}

export const VaultLockModal: React.FC<VaultLockModalProps> = ({
  isConfigured,
  isUsingDefaultPassword = true,
  onUnlock,
  onSetup,
  onResetVault,
  onQuickStart,
  isInstallable = false,
  onOpenInstall,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmationWord, setResetConfirmationWord] = useState('');

  const webCryptoSupported = isWebCryptoAvailable();

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

    const cleanPass = passphrase.trim();

    if (!cleanPass) {
      setError('Bitte geben Sie ein Master-Passwort ein.');
      return;
    }

    if (!isConfigured) {
      const cleanConfirm = confirmPassphrase.trim();
      if (cleanPass.length < 8) {
        setError('Das Master-Passwort sollte mindestens 8 Zeichen lang sein.');
        return;
      }
      if (cleanPass !== cleanConfirm) {
        setError('Die eingegebenen Passwörter stimmen nicht überein. Bitte prüfen Sie Groß-/Kleinschreibung.');
        return;
      }

      setLoading(true);
      try {
        await onSetup(cleanPass);
      } catch (err) {
        setError('Fehler bei der Initialisierung des Schlüssels: ' + String(err));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const success = await onUnlock(cleanPass);
        if (!success) {
          setError(
            isUsingDefaultPassword
              ? 'Falsches Master-Passwort. Im Standard-Modus können Sie unten „Standard-PW einfügen“ oder den Schnellstart nutzen.'
              : 'Falsches Master-Passwort. Bitte prüfen Sie Ihre Eingabe und Groß-/Kleinschreibung.'
          );
        }
      } catch (err) {
        setError('Entschlüsselungsfehler: ' + String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExecuteFactoryReset = () => {
    if (resetConfirmationWord.trim().toUpperCase() !== 'LÖSCHEN') {
      setError('Bitte tippen Sie exakt „LÖSCHEN“ ein, um den Werksreset zu bestätigen.');
      return;
    }
    setShowResetConfirm(false);
    setResetConfirmationWord('');
    onResetVault();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-center justify-center">
      <div className="w-full max-w-md my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 relative transition-all">
        {/* PWA Install Trigger on Lock Screen */}
        {isInstallable && onOpenInstall && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={onOpenInstall}
              className="p-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 rounded-xl transition-colors shadow-xs cursor-pointer active:scale-95 flex items-center justify-center"
              title="CipherNote als App auf dem Smartphone installieren"
              aria-label="App installieren"
            >
              <Download className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2.5 shadow-inner">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            {isConfigured ? 'CipherNote Tresor gesperrt' : 'Willkommen bei CipherNote'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {isConfigured
              ? isUsingDefaultPassword
                ? 'Standard-Modus aktiv: Öffnen Sie den Tresor per 1-Klick oder vergeben Sie ein eigenes Passwort.'
                : 'Mit persönlichem Master-Passwort geschützt (AES-256-GCM).'
              : 'End-to-End-verschlüsselte Notiz- & Clipboard-Zentrale mit AES-256-GCM.'}
          </p>
        </div>

        {/* Missing Web Crypto / Insecure Context Warning */}
        {!webCryptoSupported && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-2xs space-y-1">
              <p className="font-bold">Achtung: Keine HTTPS-Verbindung auf Mobilgerät</p>
              <p className="leading-relaxed">
                Mobile Webbrowser (Chrome & Safari) blockieren die Web Crypto API auf ungesicherten HTTP-Verbindungen (z. B. lokales WLAN über <code>http://192.168.x.x</code>). Mobiltelefone verlangen für Web-Verschlüsselung zwingend HTTPS.
              </p>
            </div>
          </div>
        )}

        {/* 1-Click Quickstart Button (ONLY available if vault is using default password or fresh setup) */}
        {isUsingDefaultPassword && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleQuickStartClick}
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-teal-200 shrink-0" />
              <span>App sofort öffnen (1-Klick Schnellstart)</span>
            </button>
            <p className="text-2xs text-center text-slate-400 dark:text-slate-500 mt-1.5">
              Standard-Modus aktiv (Cipher2026!) · Öffnet den Tresor direkt
            </p>
          </div>
        )}

        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 text-2xs font-medium text-slate-400 bg-white dark:bg-slate-900">
            {isConfigured
              ? isUsingDefaultPassword
                ? 'oder manuell mit Passwort entsperren'
                : 'Master-Passwort eingeben'
              : 'eigenes Master-Passwort vergeben'}
          </span>
        </div>

        {error && (
          <div className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-2xs sm:text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isConfigured ? 'Master-Passwort' : 'Neues Master-Passwort'}
              </label>
              {isConfigured && isUsingDefaultPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setPassphrase('Cipher2026!');
                    setError(null);
                  }}
                  className="text-2xs text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer active:scale-95 transition-transform"
                >
                  Standard-PW einfügen
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete={isConfigured ? 'current-password' : 'new-password'}
                enterKeyHint="go"
                placeholder={isUsingDefaultPassword ? 'Cipher2026! oder Passwort...' : 'Ihr persönliches Master-Passwort...'}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono tracking-wider min-h-[42px]"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-md"
                title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isConfigured && isUsingDefaultPassword && (
              <p className="mt-1 text-2xs text-slate-400 dark:text-slate-500">
                Standard: <code className="text-teal-600 dark:text-teal-400 font-mono font-bold">Cipher2026!</code>
              </p>
            )}

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
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="new-password"
                  enterKeyHint="go"
                  placeholder="Passwort wiederholen..."
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono tracking-wider min-h-[42px]"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-md"
                  title={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px] active:scale-98"
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
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-700 dark:text-rose-300 space-y-2.5 text-left">
                <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sicherheitswarnung: Werksreset</span>
                </div>
                <p className="text-2xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Da CipherNote echte Zero-Knowledge-Verschlüsselung nutzt, kann ein vergessenes Passwort nicht wiederhergestellt werden. Ein Werksreset löscht alle verschlüsselten Notizen auf diesem Gerät unwiderruflich!
                </p>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Tippen Sie zur Bestätigung exakt <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">LÖSCHEN</span> ein:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmationWord}
                    onChange={(e) => setResetConfirmationWord(e.target.value)}
                    placeholder="LÖSCHEN"
                    autoCapitalize="characters"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tracking-wider focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecuteFactoryReset}
                    disabled={resetConfirmationWord.trim().toUpperCase() !== 'LÖSCHEN'}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-lg text-2xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    Unwiderruflich löschen & zurücksetzen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetConfirm(false);
                      setResetConfirmationWord('');
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-2xs cursor-pointer"
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
                <span>Passwort vergessen? Werksreset anfordern</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

