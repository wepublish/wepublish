import qrcode from 'qrcode-generator';

export type QrSvgOptions = {
  sizeMm?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
};

export const renderQrSvg = (
  text: string,
  { sizeMm = 50, errorCorrectionLevel = 'M' }: QrSvgOptions = {}
): string => {
  const qr = qrcode(0, errorCorrectionLevel);
  qr.addData(text);
  qr.make();

  // A scalable svg carries no size of its own and would stretch to the full
  // width of the mail or page, so the size goes onto the <svg> element (not
  // the first `width` in the markup, which belongs to the background rect).
  return qr
    .createSvgTag({ cellSize: 1, margin: 2, scalable: true })
    .replace(
      '<svg',
      `<svg role="img" aria-label="QR code" width="${sizeMm}mm" height="${sizeMm}mm" style="display:block;margin:0 auto"`
    );
};
