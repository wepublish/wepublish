import qrcode from 'qrcode-generator';

export type QrSvgOptions = {
  sizeMm?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
};

export const renderQrSvg = (
  text: string,
  { sizeMm = 30, errorCorrectionLevel = 'M' }: QrSvgOptions = {}
): string => {
  const qr = qrcode(0, errorCorrectionLevel);
  qr.addData(text);
  qr.make();

  return qr
    .createSvgTag({ cellSize: 1, margin: 2, scalable: true })
    .replace(/width="[^"]*"/, `width="${sizeMm}mm"`)
    .replace(/height="[^"]*"/, `height="${sizeMm}mm"`)
    .replace('<svg', '<svg role="img" aria-label="QR code"');
};
