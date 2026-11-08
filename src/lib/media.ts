/**
 * Media utilities for client-side image compression and audio recording/processing.
 * Everything runs locally in browser memory without sending data to third parties.
 */

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file before storing in encrypted localStorage.
 * Resizes images over maxDim and compresses to WebP/JPEG to save space while retaining high clarity.
 */
export async function compressImage(
  file: File | Blob,
  maxDim = 1280,
  quality = 0.82
): Promise<{ dataUrl: string; sizeBytes: number; name: string; mimeType: string }> {
  const fileName = (file instanceof File && file.name) ? file.name : `foto-${Date.now()}.jpg`;

  // Try modern createImageBitmap first (super fast and handles huge phone camera pictures seamlessly)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
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
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const head = dataUrl.indexOf(',') + 1;
        const sizeBytes = Math.round((dataUrl.length - head) * 0.75);

        return {
          dataUrl,
          sizeBytes,
          name: fileName.replace(/\.[^/.]+$/, '') + '.webp',
          mimeType: 'image/webp',
        };
      }
    } catch (e) {
      console.warn('createImageBitmap failed, falling back to Image element', e);
    }
  }

  // Fallback to Image element
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

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

      if (!ctx) {
        readFileAsDataUrl(file).then((dataUrl) => {
          resolve({
            dataUrl,
            sizeBytes: file.size,
            name: fileName,
            mimeType: file.type || 'image/jpeg',
          });
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
      } catch {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      const head = dataUrl.indexOf(',') + 1;
      const sizeBytes = Math.round((dataUrl.length - head) * 0.75);

      resolve({
        dataUrl,
        sizeBytes,
        name: fileName.replace(/\.[^/.]+$/, '') + '.webp',
        mimeType: 'image/webp',
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      readFileAsDataUrl(file).then((dataUrl) => {
        resolve({
          dataUrl,
          sizeBytes: file.size,
          name: fileName,
          mimeType: file.type || 'image/jpeg',
        });
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes to human readable format (e.g. 142 KB, 1.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
