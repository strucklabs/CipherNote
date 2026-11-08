import QRCode from 'qrcode';

/**
 * Synchronous, instant, zero-promise QR Code SVG generator using official ISO/IEC 18004 calculations.
 * Safe in all environments including sandboxed iframes without HTML5 Canvas restrictions.
 */
export function generateQRCodeSVG(text: string, margin = 3): string {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const total = size + margin * 2;
    let paths = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          paths += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" class="w-full h-full"><rect width="${total}" height="${total}" fill="#FFFFFF"/><path d="${paths}" fill="#000000"/></svg>`;
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

export function generateQRCodeDataURL(text: string, margin = 3): string {
  const svg = generateQRCodeSVG(text, margin);
  if (!svg) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
