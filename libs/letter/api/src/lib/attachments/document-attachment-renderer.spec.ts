import { Document, PrismaClient } from '@prisma/client';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { PdfRenderer } from '../pdf/pdf-renderer';
import {
  attachmentFilename,
  DOCX_MIME_TYPE,
  DocumentAttachmentRenderer,
} from './document-attachment-renderer';

const docx = (text: string) =>
  zipSync({
    '[Content_Types].xml': strToU8('<Types/>'),
    'word/document.xml': strToU8(
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
    ),
  });

const textOf = (file: Uint8Array) =>
  strFromU8(unzipSync(file)['word/document.xml']).replace(/<[^>]+>/g, '');

const document = (
  id: string,
  overrides: Partial<Document> = {}
): Partial<Document> & { id: string } => ({
  id,
  title: null,
  filename: `${id}.docx`,
  mimeType: DOCX_MIME_TYPE,
  extension: '.docx',
  ...overrides,
});

const data = { user: { firstName: 'Jane' } };

function setup({
  documents = [
    document('contract', { title: 'Vertrag' }),
    document('terms', { title: 'AGB' }),
  ],
  files = {
    contract: docx('Hallo {{user_firstName}}'),
    terms: docx('Es gelten die AGB.'),
  } as Record<string, Uint8Array>,
} = {}) {
  const findMany = vi.fn(
    async ({ where }: { where: { id: { in: string[] } } }) =>
      documents.filter(({ id }) => where.id.in.includes(id))
  );

  const fetchMock = vi.fn(async (url: string) => {
    const id = url.replace('https://media/document/', '');

    return files[id] ?
        new Response(new Uint8Array(files[id]))
      : new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);

  const converted: { text: string; filename: string }[] = [];
  const pdfRenderer = {
    isConfigured: async () => true,
    render: vi.fn(),
    convertDocument: vi.fn(async (file: Uint8Array, filename: string) => {
      converted.push({ text: textOf(file), filename });

      return Buffer.from(`%PDF-${converted.length}`);
    }),
  } satisfies PdfRenderer;

  const renderer = new DocumentAttachmentRenderer({
    prisma: { document: { findMany } } as unknown as PrismaClient,
    pdfRenderer,
    documentUrl: async id => `https://media/document/${id}`,
  });

  return { renderer, findMany, fetchMock, pdfRenderer, converted };
}

describe('DocumentAttachmentRenderer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fills each document in with the mail data and converts it to pdf, in the order given', async () => {
    const { renderer, converted } = setup();

    const attachments = await renderer.render(['terms', 'contract'], data);

    expect(attachments).toEqual([
      {
        filename: 'AGB.pdf',
        contentType: 'application/pdf',
        content: Buffer.from('%PDF-1'),
      },
      {
        filename: 'Vertrag.pdf',
        contentType: 'application/pdf',
        content: Buffer.from('%PDF-2'),
      },
    ]);
    expect(converted).toEqual([
      { text: 'Es gelten die AGB.', filename: 'document.docx' },
      { text: 'Hallo Jane', filename: 'document.docx' },
    ]);
  });

  it('resolves the derived placeholders a mail template can use', async () => {
    const { renderer, converted } = setup({
      documents: [document('contract')],
      files: { contract: docx('{{user_fullName}}, {{currentDate_year}}') },
    });

    await renderer.render(['contract'], {
      user: { firstName: 'Jane', name: 'Doe' },
      currentDate: new Date('2026-11-10T10:00:00Z'),
    });

    expect(converted[0].text).toBe('Jane Doe, 2026');
  });

  it('renders nothing for no documents, without asking anyone', async () => {
    const { renderer, findMany, fetchMock } = setup();

    expect(await renderer.render([], data)).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('downloads each document only once', async () => {
    const { renderer, fetchMock } = setup();

    await renderer.render(['contract'], data);
    await renderer.render(['contract'], { user: { firstName: 'John' } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('downloads again after a failed download', async () => {
    const { renderer, fetchMock } = setup();
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 503 }));

    await expect(renderer.render(['contract'], data)).rejects.toThrow(/503/);
    await expect(renderer.render(['contract'], data)).resolves.toHaveLength(1);
  });

  it('converts a document that comes out the same for everyone only once', async () => {
    const { renderer, pdfRenderer } = setup();

    await renderer.render(['terms'], data);
    await renderer.render(['terms'], { user: { firstName: 'John' } });

    expect(pdfRenderer.convertDocument).toHaveBeenCalledTimes(1);
  });

  it('converts a document again for a recipient it reads differently for', async () => {
    const { renderer, converted } = setup();

    await renderer.render(['contract'], data);
    await renderer.render(['contract'], { user: { firstName: 'John' } });

    expect(converted.map(({ text }) => text)).toEqual([
      'Hallo Jane',
      'Hallo John',
    ]);
  });

  it('converts again after a failed conversion', async () => {
    const { renderer, pdfRenderer } = setup();
    pdfRenderer.convertDocument.mockRejectedValueOnce(new Error('timeout'));

    await expect(renderer.render(['terms'], data)).rejects.toThrow('timeout');
    await expect(renderer.render(['terms'], data)).resolves.toHaveLength(1);
  });

  it('names the document that could not be converted', async () => {
    const { renderer, pdfRenderer } = setup();
    pdfRenderer.convertDocument.mockRejectedValue(
      new Error('Gotenberg is down')
    );

    await expect(renderer.render(['contract'], data)).rejects.toThrow(
      'Attachment "Vertrag" could not be rendered: Gotenberg is down'
    );
  });

  it('fails for a document that no longer exists', async () => {
    const { renderer } = setup();

    await expect(renderer.render(['gone'], data)).rejects.toThrow(
      /Attachment <gone> no longer exists/
    );
  });

  it('fails for a document that is not a Word document', async () => {
    const { renderer, fetchMock } = setup({
      documents: [
        document('flyer', {
          title: 'Flyer',
          mimeType: 'application/pdf',
          extension: '.pdf',
        }),
      ],
    });

    await expect(renderer.render(['flyer'], data)).rejects.toThrow(
      /Attachment "Flyer" is not a Word document/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails for a file that only claims to be a Word document', async () => {
    const { renderer } = setup({
      documents: [document('contract', { title: 'Vertrag' })],
      files: { contract: strToU8('%PDF-1.7') },
    });

    await expect(renderer.render(['contract'], data)).rejects.toThrow(
      /Attachment "Vertrag" could not be rendered: Not a Word document/
    );
  });

  it('lists the placeholders the documents use', async () => {
    const { renderer } = setup();

    expect(await renderer.placeholders(['contract', 'terms'])).toEqual([
      'user_firstName',
    ]);
  });
});

describe('attachmentFilename', () => {
  it('takes the title, else the filename, else the id', () => {
    expect(
      attachmentFilename({
        id: 'd1',
        title: 'Vertrag 2026',
        filename: 'x.docx',
      })
    ).toBe('Vertrag 2026.pdf');
    expect(
      attachmentFilename({ id: 'd1', title: null, filename: 'agb.docx' })
    ).toBe('agb.pdf');
    expect(attachmentFilename({ id: 'd1', title: ' ', filename: null })).toBe(
      'd1.pdf'
    );
  });

  it('keeps out what a file name cannot hold', () => {
    expect(
      attachmentFilename({
        id: 'd1',
        title: 'Q1/Q2: "Bericht"',
        filename: null,
      })
    ).toBe('Q1 Q2 Bericht.pdf');
  });

  it('keeps out control characters', () => {
    expect(
      attachmentFilename({ id: 'd1', title: 'Bericht\tQ1\n', filename: null })
    ).toBe('Bericht Q1.pdf');
  });
});
