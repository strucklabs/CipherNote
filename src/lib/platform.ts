export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isMobileUa || (isTouch && isSmallScreen);
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareNoteViaNative(title: string, content: string): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share({
      title: title || 'CipherNote',
      text: `${title ? title + '\n\n' : ''}${content}`,
    });
    return true;
  } catch (err) {
    // User cancelled or share failed
    if ((err as Error).name !== 'AbortError') {
      console.warn('Share error:', err);
    }
    return false;
  }
}
