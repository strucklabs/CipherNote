import React from 'react';
import { Download, X, Smartphone, Check, MoreVertical, Share, ExternalLink } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onTriggerNativePrompt?: () => void;
  hasNativePrompt?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onTriggerNativePrompt,
  hasNativePrompt = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                CipherNote als App installieren
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Offline nutzbar · Eigenständiges App-Icon · Schneller Start
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

        {/* Content depending on OS */}
        {hasNativePrompt ? (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ihr Browser unterstützt die direkte 1-Klick-Installation. Klicken Sie unten, um CipherNote zu Ihren Apps hinzuzufügen:
            </p>
            <button
              type="button"
              onClick={onTriggerNativePrompt}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Jetzt auf dem Startbildschirm installieren</span>
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Guide */
          <div className="space-y-3 py-1 text-xs text-slate-700 dark:text-slate-200">
            <p className="text-slate-500 dark:text-slate-400 text-2xs leading-relaxed">
              Auf iPhones & iPads erfolgt die Installation über Safari in 3 einfachen Schritten:
            </p>

            <ol className="space-y-2.5">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex-1">
                  <span className="font-semibold">Teilen-Symbol antippen</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tippen Sie unten in der Safari-Leiste auf das Teilen-Symbol (Viereck mit Pfeil nach oben <Share className="w-3 h-3 inline text-teal-600 dark:text-teal-400" />).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <span className="font-semibold">„Zum Home-Bildschirm“</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Wischen Sie in der Liste etwas nach unten und wählen Sie <strong>„Zum Home-Bildschirm“</strong>.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1">
                  <span className="font-semibold">„Hinzufügen“ bestätigen</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tippen Sie oben rechts auf <strong>„Hinzufügen“</strong>. CipherNote startet fortan wie eine native App ohne Browserleiste!
                  </p>
                </div>
              </li>
            </ol>
          </div>
        ) : (
          /* Android Chrome Guide */
          <div className="space-y-3 py-1 text-xs text-slate-700 dark:text-slate-200">
            {onTriggerNativePrompt && (
              <button
                type="button"
                onClick={onTriggerNativePrompt}
                className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Installationsversuch starten</span>
              </button>
            )}

            <p className="text-slate-500 dark:text-slate-400 text-2xs leading-relaxed">
              Oder installieren Sie CipherNote in Sekunden über das Browser-Menü:
            </p>

            <ol className="space-y-2.5">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex-1">
                  <span className="font-semibold">Menü öffnen</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tippen Sie oben rechts in Chrome auf die drei Punkte (<MoreVertical className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-200" />).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <span className="font-semibold">„App installieren“ auswählen</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Wählen Sie im Menü den Punkt <strong>„App installieren“</strong> (oder <strong>„Zum Startbildschirm hinzufügen“</strong>).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1">
                  <span className="font-semibold">Fertig!</span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    CipherNote erscheint nun als eigenständige App mit Icon auf Ihrem Home-Screen und im Android-„Teilen mit...“-Menü!
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Benefits reminder */}
        <div className="p-3 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1.5 text-2xs text-slate-600 dark:text-slate-300">
          <p className="font-bold text-teal-800 dark:text-teal-300">Vorteile der installierten App:</p>
          <ul className="space-y-1 list-none">
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Vollbildansicht ohne störende Browserleisten</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Texte & Links aus jeder Android-App direkt über „Teilen“ empfangen</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>100% offline nutzbar mit sicherem lokalen AES-Tresor</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Verstanden / Schließen
        </button>
      </div>
    </div>
  );
};
