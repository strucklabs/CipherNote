import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, AlertCircle, UploadCloud, Play } from 'lucide-react';
import { NoteAttachment } from '../types';
import { readFileAsDataUrl, formatDuration } from '../lib/media';

interface AudioVoiceRecorderProps {
  onSaveAudio: (attachment: NoteAttachment) => void;
  onCancel: () => void;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  onSaveAudio,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef<boolean>(false);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  // Start recording once on mount
  useEffect(() => {
    let mounted = true;

    const initRecording = async () => {
      setError(null);
      audioChunksRef.current = [];
      setSeconds(0);
      secondsRef.current = 0;
      isStoppingRef.current = false;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (mounted) {
            setError('Mikrofon im Browser nicht unterstützt. Bitte System-Aufnahme unten nutzen.');
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        // Supported mimeType detection
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          }
        }

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          // If stopped intentionally, package and save
          if (!isStoppingRef.current) return;

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType });
          if (audioBlob.size > 0) {
            try {
              const dataUrl = await readFileAsDataUrl(audioBlob);
              const now = new Date();
              const timestampStr = `${now.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
              })} um ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;

              onSaveAudio({
                id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: `Sprachmemo vom ${timestampStr}`,
                type: 'audio',
                mimeType: recorder.mimeType || mimeType,
                dataUrl,
                sizeBytes: audioBlob.size,
                createdAt: Date.now(),
                durationSeconds: Math.max(1, secondsRef.current),
              });
            } catch (err) {
              console.error('Error reading audio dataUrl:', err);
              onCancel();
            }
          } else {
            onCancel();
          }
        };

        recorder.start(250);
        if (mounted) {
          setIsRecording(true);
          timerRef.current = window.setInterval(() => {
            setSeconds((prev) => prev + 1);
          }, 1000);
        }
      } catch (err) {
        console.warn('Microphone permission or hardware error:', err);
        if (mounted) {
          setError(
            'Mikrofon nicht freigegeben. Bitte Berechtigung erteilen oder die System-Aufnahme unten antippen.'
          );
        }
      }
    };

    initRecording();

    return () => {
      mounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          // Remove onstop so unmount does NOT trigger spurious onCancel or save
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleStopAndSave = () => {
    isStoppingRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.requestData();
      } catch {
        // Ignore
      }
      recorder.stop();
    } else {
      onCancel();
    }
  };

  const handleAbort = () => {
    isStoppingRef.current = false;
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    onCancel();
  };

  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onSaveAudio({
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name || 'Sprachaufnahme',
        type: 'audio',
        mimeType: file.type || 'audio/webm',
        dataUrl,
        sizeBytes: file.size,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error('Fallback audio error:', err);
      onCancel();
    }
  };

  return (
    <div className="p-3.5 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2.5 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {isRecording && !error ? (
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
            </span>
          ) : (
            <Mic className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
            {error ? 'Aufnahme-Hinweis' : 'Aufnahme läuft... Bitte sprechen'}
          </span>
          {!error && (
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 ml-1 shrink-0 tabular-nums">
              {formatDuration(seconds)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!error && isRecording && (
            <button
              type="button"
              onClick={handleStopAndSave}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Fertig & Speichern</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAbort}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            title="Aufnahme abbrechen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="space-y-2 pt-1">
          <div className="text-2xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>System-Diktiergerät öffnen / Datei wählen</span>
          </button>
        </div>
      )}

      {/* Hidden input for mobile native audio capture fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFallbackFileSelect}
      />
    </div>
  );
};
