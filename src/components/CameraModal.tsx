import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { NoteAttachment } from '../types';
import { compressImage, formatBytes } from '../lib/media';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (attachment: NoteAttachment) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapturePhoto,
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedSize, setCapturedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Start camera stream with specified facingMode
  const startCamera = async (mode: 'environment' | 'user') => {
    stopTracks();
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Kamera-Zugriff im Browser nicht verfügbar. Bitte nutzen Sie die System-Kamera.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      // Try fallback to any video source if environment failed
      if (mode === 'environment') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setIsStreaming(true);
            return;
          }
        } catch {
          // Fall through
        }
      }
      setError('Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen oder unten die System-Kamera wählen.');
    }
  };

  // Start on open, stop on close
  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      setCapturedSize(0);
      setError(null);
      startCamera(facingMode);
    } else {
      stopTracks();
      setCapturedPreview(null);
    }

    return () => {
      stopTracks();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle between front and rear cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setCapturedPreview(null);
    startCamera(nextMode);
  };

  // Snap photo from live video frame
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !isStreaming) return;

    try {
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      const maxDim = 1280;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Export as WebP or JPEG
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }
      } catch {
        dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      }

      const head = dataUrl.indexOf(',') + 1;
      const sizeBytes = Math.round((dataUrl.length - head) * 0.75);

      setCapturedPreview(dataUrl);
      setCapturedSize(sizeBytes);
      stopTracks();
    } catch (err) {
      console.error('Error taking snapshot:', err);
      setError('Fehler beim Aufnehmen des Fotos.');
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPreview(null);
    setCapturedSize(0);
    startCamera(facingMode);
  };

  // Confirm photo and save
  const confirmPhoto = () => {
    if (!capturedPreview) return;
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    onCapturePhoto({
      id: `img-${now}-${Math.random().toString(36).slice(2, 7)}`,
      name: `Kamera-Foto ${timeStr}.webp`,
      type: 'image',
      mimeType: 'image/webp',
      dataUrl: capturedPreview,
      sizeBytes: capturedSize || 80000,
      createdAt: now,
    });
    onClose();
  };

  // Fallback for native smartphone camera or file select
  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const compressed = await compressImage(file, 1280, 0.82);
      setCapturedPreview(compressed.dataUrl);
      setCapturedSize(compressed.sizeBytes);
      stopTracks();
    } catch (err) {
      console.error('Fallback camera error:', err);
      setError('Foto konnte nicht verarbeitet werden.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Kamera
              </h3>
              <p className="text-3xs text-slate-500 dark:text-slate-400">
                Live-Sucher · AES-256-GCM verschlüsselt
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

        {/* Viewfinder area */}
        <div className="relative bg-black aspect-4/3 w-full flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            /* Snapped Photo Preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPreview}
                alt="Aufgenommenes Foto"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-3xs font-mono px-2 py-1 rounded-md border border-white/20">
                {formatBytes(capturedSize)}
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder corner guidelines */}
              {isStreaming && (
                <div className="absolute inset-6 pointer-events-none border-2 border-white/25 rounded-2xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                    <span className="w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                    <span className="w-4 h-4 border-b-2 border-r-2 border-teal-400" />
                  </div>
                </div>
              )}

              {/* Loading spinner while stream starts */}
              {!isStreaming && !error && (
                <div className="flex flex-col items-center gap-2 text-white/70 text-xs">
                  <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span>Kamera wird gestartet...</span>
                </div>
              )}
            </>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
              <div className="w-7 h-7 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Foto wird verarbeitet...</span>
            </div>
          )}
        </div>

        {/* Error notice if camera unavailable */}
        {error && (
          <div className="m-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-2xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-teal-600 dark:text-teal-400 underline font-medium hover:opacity-80"
              >
                Smartphone-Kamera oder Datei wählen
              </button>
            </div>
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {capturedPreview ? (
            /* Actions after snapshot */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={retakePhoto}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Wiederholen</span>
              </button>

              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Foto übernehmen</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex items-center justify-between gap-3">
              {/* Fallback to Native / File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors cursor-pointer"
                title="System-Kamera oder Galerie öffnen"
              >
                <Upload className="w-4 h-4" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={!isStreaming}
                className={`w-16 h-16 rounded-full border-4 border-teal-500/40 p-1 flex items-center justify-center transition-all cursor-pointer ${
                  isStreaming
                    ? 'hover:scale-105 active:scale-95 opacity-100'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                title="Foto aufnehmen"
              >
                <div className="w-full h-full rounded-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 shadow-lg flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              {/* Switch Camera (Rear / Front) */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors cursor-pointer"
                title={facingMode === 'environment' ? 'Zur Frontkamera wechseln' : 'Zur Rückkamera wechseln'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Hidden fallback file input with capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFallbackFile}
        />
      </div>
    </div>
  );
};
