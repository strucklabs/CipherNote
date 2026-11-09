import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface VaultSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUsingDefaultPassword: boolean;
  onChangeMasterPassword: (
    currentPass: string,
    newPass: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const VaultSecurityModal: React.FC<VaultSecurityModalProps> = ({
  isOpen,
  onClose,
  isUsingDefaultPassword,
  onChangeMasterPassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    return { score: 3, label: 'Stark (AES-256 empfohlen)', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setError('Bitte geben Sie Ihr aktuelles Master-Passwort ein.');
      return;
    }

    if (cleanNew.length < 8) {
      setError('Das neue Master-Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setError('Das neue Passwort muss sich vom aktuellen Passwort unterscheiden.');
      return;
    }

    setLoading(true);
    try {
      const res = await onChangeMasterPassword(cleanCurrent, cleanNew);
      if (res.success) {
        setSuccessMsg(
          'Master-Passwort erfolgreich geändert! Alle Notizen wurden mit dem neuen AES-256-GCM Schlüssel neu verschlüsselt.'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(res.error || 'Aktuelles Passwort ist ungültig.');
      }
    } catch (err) {
      setError('Fehler beim Neu-Verschlüsseln: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tresor-Sicherheit & Passwort
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                AES-256-GCM End-to-End-Verschlüsselung verwalten
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Security Status Card */}
        <div
          className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
            isUsingDefaultPassword
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-2xs uppercase tracking-wider">
            {isUsingDefaultPassword ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Standard-Passwort aktiv (Cipher2026!)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Persönliches Master-Passwort aktiv</span>
              </>
            )}
          </div>
          <p className="text-2xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isUsingDefaultPassword
              ? 'Ihr Tresor ist derzeit mit dem Standard-Schlüssel verschlüsselt. Vergeben Sie hier ein eigenes Master-Passwort, damit niemand ohne Ihr Passwort Ihre Notizen einsehen kann.'
              : 'Ihre Notizen sind mit Ihrem individuellen Master-Passwort geschützt. Niemand ohne das Passwort kann die Daten entschlüsseln.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-2xs leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-2xs font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Current Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300">
                Aktuelles Passwort
              </label>
              {isUsingDefaultPassword && (
                <button
                  type="button"
                  onClick={() => setCurrentPassword('Cipher2026!')}
                  className="text-2xs text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Standard-PW einfügen
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Aktuelles Master-Passwort..."
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-h-[38px]"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Neues Master-Passwort
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Mindestens 8 Zeichen..."
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-h-[38px]"
              />
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
                  <span>Sicherheitsstufe:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.score >= 1 ? strength.color : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.score >= 2 ? strength.color : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.score >= 3 ? strength.color : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Neues Passwort bestätigen
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Passwort wiederholen..."
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-h-[38px]"
              />
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[40px] active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Notizen werden neu verschlüsselt...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Master-Passwort jetzt festlegen</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-2xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          Wichtig: Da CipherNote Zero-Knowledge-Verschlüsselung nutzt, existiert keine „Passwort vergessen“-Funktion über E-Mail. Notieren Sie sich Ihr Master-Passwort gut.
        </p>
      </div>
    </div>
  );
};
