import React, { useState } from 'react';
import { NoteAttachment } from '../types';
import {
  Image as ImageIcon,
  Volume2,
  Trash2,
  Download,
  Maximize2,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { formatBytes, formatDuration } from '../lib/media';

interface NoteAttachmentsViewProps {
  attachments: NoteAttachment[];
  onRemoveAttachment: (id: string) => void;
  readOnly?: boolean;
}

export const NoteAttachmentsView: React.FC<NoteAttachmentsViewProps> = ({
  attachments,
  onRemoveAttachment,
  readOnly = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type === 'image');
  const audios = attachments.filter((a) => a.type === 'audio');
  const others = attachments.filter((a) => a.type !== 'image' && a.type !== 'audio');

  const handleDownload = (att: NoteAttachment) => {
    const a = document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Images Section */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-2xs font-semibold text-slate-500 dark:text-slate-400">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Bilder ({images.length})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center shadow-xs"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-200"
                  onClick={() => setSelectedImage(img.dataUrl)}
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-1.5 flex items-center justify-between text-[10px] text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="truncate max-w-[100px] font-medium">{img.name}</span>
                  <span className="font-mono">{formatBytes(img.sizeBytes)}</span>
                </div>

                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedImage(img.dataUrl)}
                    className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white cursor-pointer shadow-xs"
                    title="Vergrößern"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => onRemoveAttachment(img.id)}
                      className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white cursor-pointer shadow-xs"
                      title="Bild entfernen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Memos Section */}
      {audios.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-2xs font-semibold text-slate-500 dark:text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Sprachmemos & Audio ({audios.length})</span>
          </div>

          <div className="space-y-2">
            {audios.map((aud) => (
              <div
                key={aud.id}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {aud.name}
                    </p>
                    <p className="text-2xs text-slate-400 flex items-center gap-2">
                      <span>{formatBytes(aud.sizeBytes)}</span>
                      {aud.durationSeconds ? (
                        <>
                          <span>•</span>
                          <span>{formatDuration(aud.durationSeconds)}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <audio
                    src={aud.dataUrl}
                    controls
                    className="h-8 max-w-[200px] sm:max-w-[220px]"
                  />

                  <button
                    onClick={() => handleDownload(aud)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    title="Audio herunterladen"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {!readOnly && (
                    <button
                      onClick={() => onRemoveAttachment(aud.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Audio löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Fullscreen Image Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-lg bg-slate-800/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Vollbild Vorschau"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
