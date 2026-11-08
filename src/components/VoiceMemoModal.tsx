import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Play, Pause, AlertCircle, UploadCloud, CheckCircle2, Shield } from 'lucide-react';
import { NoteAttachment } from '../types';
import { readFileAsDataUrl, formatDuration, formatBytes } from '../lib/media';

interface VoiceMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAudioMemo: (attachment: NoteAttachment) => void;
}

export const VoiceMemoModal: React.FC<VoiceMemoModalProps> = ({
  isOpen,
  onClose,
  onSaveAudioMemo,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setIsRecording(false);
      setSeconds(0);
      setError(null);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setIsPlayingPreview(false);
    }
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  if (!isOpen) return null;

  const startLiveRecording = async () => {
    setError(null);
    setRecordedBlob(null);
    setPreviewUrl(null);
    audioChunksRef.current = [];
    setSeconds(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Mikrofon-Zugriff im Browser nicht verfügbar. Bitte nutzen Sie das Smartphone-Diktiergerät unten.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let selectedMimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
        ];
        for (const candidate of candidates) {
          try {
            if (MediaRecorder.isTypeSupported(candidate)) {
              selectedMimeType = candidate;
              break;
            }
          } catch {
            // Ignore check error
          }
        }
      }

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const outMime = recorder.mimeType || selectedMimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: outMime });
        if (finalBlob.size > 0) {
          setRecordedBlob({ blob: finalBlob, mimeType: outMime });
          const url = URL.createObjectURL(finalBlob);
          setPreviewUrl(url);
        }
      };

      recorder.start(250);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (err: unknown) {
      console.warn('Microphone error:', err);
      setError('Mikrofon-Zugriff im Browser nicht freigegeben. Tippen Sie unten auf „Smartphone-Diktiergerät öffnen“.');
    }
  };

  const stopLiveRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // Ignore
      }
      mediaRecorderRef.current.stop();
    }
  };

  const handleSaveAndAttach = async () => {
    if (!recordedBlob) return;
    try {
      const dataUrl = await readFileAsDataUrl(recordedBlob.blob);
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} um ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;

      onSaveAudioMemo({
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `Sprachmemo vom ${dateStr}`,
        type: 'audio',
        mimeType: recordedBlob.mimeType,
        dataUrl,
        sizeBytes: recordedBlob.blob.size,
        durationSeconds: Math.max(1, seconds),
        createdAt: Date.now(),
      });
      onClose();
    } catch (e) {
      console.error('Failed to save memo:', e);
      setError('Fehler beim Verschlüsseln der Audiodatei.');
    }
  };

  const handleNativeRecorderFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} um ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;

      onSaveAudioMemo({
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name || `Sprachmemo vom ${dateStr}`,
        type: 'audio',
        mimeType: file.type || 'audio/webm',
        dataUrl,
        sizeBytes: file.size,
        createdAt: Date.now(),
      });
      onClose();
    } catch (err: unknown) {
      console.error('Native recorder file error:', err);
      setError('Fehler beim Verarbeiten der Aufnahme.');
    } finally {
      e.target.value = '';
    }
  };

  const togglePreviewPlay = () => {
    if (!audioPlayerRef.current || !previewUrl) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sprachmemo aufnehmen
              </h3>
              <p className="text-3xs text-slate-500 dark:text-slate-400">
                AES-256-GCM verschlüsselt
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

        {/* Center Recording State */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {/* Big Interactive Mic Button */}
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <span className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopLiveRecording : startLiveRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/30'
                  : recordedBlob
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            >
              {isRecording ? (
                <Square className="w-8 h-8 fill-current" />
              ) : recordedBlob ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>
          </div>

          {/* Status Label & Timer */}
          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {isRecording ? (
                <span className="text-rose-600 dark:text-rose-400 text-lg">
                  {formatDuration(seconds)}
                </span>
              ) : recordedBlob ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Aufnahme bereit ({formatDuration(seconds)})
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  Tippen Sie auf das Mikrofon, um zu sprechen
                </span>
              )}
            </div>
            {isRecording && (
              <p className="text-2xs text-rose-600 dark:text-rose-400 font-medium animate-pulse">
                Aufnahme läuft... Tippen zum Beenden
              </p>
            )}
          </div>

          {/* Audio Preview if ready */}
          {previewUrl && !isRecording && (
            <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <audio
                ref={audioPlayerRef}
                src={previewUrl}
                onEnded={() => setIsPlayingPreview(false)}
                className="hidden"
              />
              <button
                type="button"
                onClick={togglePreviewPlay}
                className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center cursor-pointer shadow-xs"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0 text-2xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold truncate">Aufnahme anhören</p>
                <p className="font-mono text-3xs text-slate-400">
                  {recordedBlob ? formatBytes(recordedBlob.blob.size) : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={startLiveRecording}
                className="text-2xs text-rose-500 hover:underline cursor-pointer"
              >
                Neu aufnehmen
              </button>
            </div>
          )}

          {/* Error Message if any */}
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-2xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {recordedBlob ? (
            <button
              type="button"
              onClick={handleSaveAndAttach}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Als verschlüsselte Notiz speichern</span>
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={stopLiveRecording}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Aufnahme beenden & prüfen</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Smartphone-Diktiergerät öffnen / Datei</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-2xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-center cursor-pointer"
          >
            Abbrechen
          </button>
        </div>

        {/* Native phone audio capture input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          capture="user"
          className="hidden"
          onChange={handleNativeRecorderFile}
        />
      </div>
    </div>
  );
};
