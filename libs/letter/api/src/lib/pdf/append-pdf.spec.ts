import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { A4, appendPdf } from './append-pdf';

const makePdf = async (pages: number, size: [number, number] = A4) => {
  const doc = await PDFDocument.create();

  for (let i = 0; i < pages; i++) {
    doc.addPage(size);
  }

  doc.setTitle(`${pages} pages`);

  return Buffer.from(await doc.save());
};

const pageCount = async (pdf: Buffer) =>
  (await PDFDocument.load(pdf)).getPageCount();

describe('appendPdf', () => {
  it('appends the appendix pages after the main pages', async () => {
    const result = await appendPdf(await makePdf(1), await makePdf(1), {
      padToOddPage: false,
    });

    expect(result.subarray(0, 5).toString()).toBe('%PDF-');
    expect(await pageCount(result)).toBe(2);
  });

  it('inserts a blank page so the appendix starts on an odd page', async () => {
    const result = await appendPdf(await makePdf(1), await makePdf(1), {
      padToOddPage: true,
    });

    expect(await pageCount(result)).toBe(3);
  });

  it('needs no blank page when the main part has an even page count', async () => {
    const result = await appendPdf(await makePdf(2), await makePdf(1), {
      padToOddPage: true,
    });

    expect(await pageCount(result)).toBe(3);
  });

  it('keeps the appendix page last', async () => {
    const appendix = await makePdf(1, [A4[0], A4[1] - 0.5]);
    const result = await PDFDocument.load(
      await appendPdf(await makePdf(1), appendix, { padToOddPage: true })
    );
    const pages = result.getPages();

    expect(pages[pages.length - 1].getHeight()).toBeCloseTo(A4[1] - 0.5);
    expect(pages[0].getHeight()).toBe(A4[1]);
  });

  it('rejects an appendix that is not A4', async () => {
    await expect(
      appendPdf(await makePdf(1), await makePdf(1, [612, 792]), {
        padToOddPage: false,
      })
    ).rejects.toThrow(/A4/);
  });
});
