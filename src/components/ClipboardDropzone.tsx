import React, { useState, useRef } from 'react';
import { Clipboard, Sparkles, Check, ArrowDownToLine, Camera, Mic } from 'lucide-react';
import { playClipboardChime } from '../lib/sound';
import { isMobileDevice } from '../lib/platform';

interface ClipboardDropzoneProps {
  onCapture: (text: string) => void;
  onCaptureMedia?: (file: File) => void;
  onStartVoiceMemo?: () => void;
  onStartCamera?: () => void;
}

export const ClipboardDropzone: React.FC<ClipboardDropzoneProps> = ({
  onCapture,
  onCaptureMedia,
  onStartVoiceMemo,
  onStartCamera,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isMobile = isMobileDevice();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const triggerFeedback = (message: string) => {
    setFeedback(message);
    playClipboardChime();
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  const handleReadClipboard = async () => {
    try {
      // First check for clipboard items (which can contain images/blobs)
      if (navigator.clipboard?.read && onCaptureMedia) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const file = new File([blob], `Zwischenablage-${Date.now()}.png`, { type: imageType });
              onCaptureMedia(file);
              triggerFeedback('Bild aus Zwischenablage erfasst!');
              return;
            }
          }
        } catch {
          // Fall through to text read if image read rejected
        }
      }

      if (!navigator.clipboard?.readText) {
        // Fallback prompt if clipboard API is restricted in iframe
        const pasted = window.prompt('Fügen Sie hier Ihren Zwischenablage-Inhalt ein:');
        if (pasted && pasted.trim()) {
          onCapture(pasted);
          triggerFeedback('Eintrag aus Zwischenablage erfasst!');
        }
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        triggerFeedback('Zwischenablage ist leer.');
        return;
      }

      onCapture(text);
      triggerFeedback('Zwischenablage erfolgreich erfasst!');
    } catch {
      // Permission prompt / manual fallback
      const pasted = window.prompt('Fügen Sie hier Ihren Zwischenablage-Inhalt ein:');
      if (pasted && pasted.trim()) {
        onCapture(pasted);
        triggerFeedback('Eintrag erfasst!');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Check for dropped files (images or audio)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onCaptureMedia) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
        onCaptureMedia(file);
        triggerFeedback(file.type.startsWith('image/') ? 'Bild als Notiz erfasst!' : 'Audio als Notiz erfasst!');
        return;
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text && text.trim()) {
      onCapture(text);
      triggerFeedback('Gedroppter Text als Notiz erfasst!');
    }
  };

  return (
    <div className="relative">
      <div
        onDragOver={(e) => {
          if (isMobile) return;
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={handleReadClipboard}
        className={`group relative overflow-hidden border border-dashed rounded-xl p-3.5 transition-all cursor-pointer select-none min-h-[52px] ${
          isDragOver
            ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/20 shadow-sm scale-101'
            : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/60 hover:border-teal-500/60 hover:bg-teal-50/40 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform shrink-0">
              {feedback ? (
                <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
              ) : (
                <Clipboard className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                <span>Aus Zwischenablage erfassen</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMobile ? (
                  <span>Tippen zum automatischen Einfügen aus der Zwischenablage</span>
                ) : (
                  <>
                    Klicken, Text hierher ziehen oder überall{' '}
                    <kbd className="font-mono text-2xs px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
                      Strg+V
                    </kbd>{' '}
                    drücken
                  </>
                )}
              </p>
            </div>
          </div>

          {!isMobile && (
            <div className="hidden sm:flex items-center gap-1 text-2xs text-slate-400 font-mono shrink-0">
              <ArrowDownToLine className="w-3.5 h-3.5 opacity-60 group-hover:translate-y-0.5 transition-transform" />
            </div>
          )}
        </div>

        {/* Transient feedback banner overlay */}
        {feedback && (
          <div className="absolute inset-0 bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center text-xs font-medium px-4 transition-all">
            <Check className="w-4 h-4 mr-1.5" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Quick Action Chips for Media on Mobile & Desktop */}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onStartCamera) {
              onStartCamera();
            } else {
              cameraInputRef.current?.click();
            }
          }}
          className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Kamera öffnen & Foto aufnehmen"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Kamera</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onStartVoiceMemo) {
              onStartVoiceMemo();
            } else {
              audioInputRef.current?.click();
            }
          }}
          className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-lg text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Audio aufnehmen oder anhängen"
        >
          <Mic className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Audio</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReadClipboard();
          }}
          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
          title="Aus Zwischenablage einfügen"
        >
          <Clipboard className="w-3 h-3 text-slate-500" />
          <span className="hidden sm:inline">Einfügen</span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onCaptureMedia) {
            onCaptureMedia(file);
            triggerFeedback('Foto mit Kamera erfasst!');
          }
          e.target.value = '';
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onCaptureMedia) {
            onCaptureMedia(file);
            triggerFeedback('Audio erfasst!');
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};
