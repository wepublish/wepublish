import { PageSizes, PDFDocument } from 'pdf-lib';

export const A4 = PageSizes.A4;

const TOLERANCE = 1;

const isA4 = (width: number, height: number) =>
  Math.abs(width - A4[0]) <= TOLERANCE && Math.abs(height - A4[1]) <= TOLERANCE;

export type AppendPdfOptions = {
  /**
   * Insert a blank page before the appendix when needed, so it starts on an
   * odd page. Duplex printing needs that for payment slips: Pingen prints them
   * on pre-perforated paper and only accepts them on the front of a sheet.
   */
  padToOddPage: boolean;
};

/** Append the pages of a static pdf (e.g. a QR-bill) after a rendered letter. */
export async function appendPdf(
  main: Buffer,
  appendix: Buffer,
  { padToOddPage }: AppendPdfOptions
): Promise<Buffer> {
  const [doc, extra] = await Promise.all([
    PDFDocument.load(main),
    PDFDocument.load(appendix),
  ]);

  const extraPages = extra.getPages();
  const notA4 = extraPages.find(
    page => !isA4(page.getWidth(), page.getHeight())
  );

  if (notA4) {
    throw new Error(
      `Letter appendix must be A4 (${A4[0]}×${A4[1]} pt), got ${notA4.getWidth()}×${notA4.getHeight()} pt`
    );
  }

  if (padToOddPage && doc.getPageCount() % 2 === 1) {
    doc.addPage(A4);
  }

  const copied = await doc.copyPages(extra, extra.getPageIndices());
  copied.forEach(page => doc.addPage(page));

  return Buffer.from(await doc.save());
}
