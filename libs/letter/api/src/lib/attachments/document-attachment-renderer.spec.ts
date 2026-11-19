import { Document, PrismaClient } from '@prisma/client';
import { MailAttachmentError } from '@wepublish/mail/api';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { PdfRenderer, PdfRendererError } from '../pdf/pdf-renderer';
import {
  attachmentFilename,
  CONVERSION_FAILURES_BEFORE_PAUSE,
  CONVERSION_PAUSE_MS,
  DOCX_MIME_TYPE,
  DocumentAttachmentRenderer,
  MAX_ATTACHMENT_BYTES,
  RecentCache,
} from './document-attachment-renderer';

const docx = (text: string) =>
  zipSync({
    '[Content_Types].xml': strToU8('<Types/>'),
    'word/document.xml': strToU8(
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
    ),
  });

/** The text Word would show: every text node of the body, in order. */
const textOf = (file: Uint8Array) =>
  [
    ...strFromU8(unzipSync(file)['word/document.xml']).matchAll(
      /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g
    ),
  ]
    .map(match => match[1])
    .join('');

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
  enabled = async () => true,
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
    canConvertDocuments: vi.fn(async () => true),
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
    enabled,
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

    const failure = renderer.render(['contract'], data);

    await expect(failure).rejects.toThrow(
      'Attachment "Vertrag" could not be rendered: Gotenberg is down'
    );
    // Every caller tells a failed attachment from a failed delivery by this.
    await expect(failure).rejects.toBeInstanceOf(MailAttachmentError);
  });

  describe('when the medium has attachments switched off', () => {
    it('attaches nothing, without asking anyone', async () => {
      // Templates keep their attachments while the feature is off, invisible
      // in the editor; a mail must not carry what nobody can see.
      const { renderer, findMany, fetchMock, pdfRenderer } = setup({
        enabled: async () => false,
      });

      expect(await renderer.render(['contract'], data)).toEqual([]);
      expect(await renderer.placeholders(['contract'])).toEqual([]);
      expect(findMany).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(pdfRenderer.convertDocument).not.toHaveBeenCalled();
    });

    it('is not available', async () => {
      const { renderer } = setup({ enabled: async () => false });

      expect(await renderer.isAvailable()).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('is available with a renderer that converts documents', async () => {
      const { renderer } = setup();

      expect(await renderer.isAvailable()).toBe(true);
    });

    it('is not available with a renderer that only prints html', async () => {
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.canConvertDocuments.mockResolvedValue(false);

      expect(await renderer.isAvailable()).toBe(false);
    });

    it('is not available without any renderer', async () => {
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.canConvertDocuments.mockRejectedValue(
        new Error('No pdf renderer is configured.')
      );

      expect(await renderer.isAvailable()).toBe(false);
    });
  });

  describe('when conversions keep failing', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function failInARow(
      renderer: DocumentAttachmentRenderer,
      times: number
    ) {
      for (let attempt = 0; attempt < times; attempt++) {
        await expect(renderer.render(['terms'], data)).rejects.toThrow(
          'timed out'
        );
      }
    }

    it('stops asking the renderer for a while, failing at once', async () => {
      // Each attempt at a renderer that is down waits for its timeout; a send
      // job would otherwise wait that long for every recipient.
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.convertDocument.mockRejectedValue(
        new PdfRendererError('timed out')
      );

      await failInARow(renderer, CONVERSION_FAILURES_BEFORE_PAUSE);
      pdfRenderer.convertDocument.mockClear();

      const paused = renderer.render(['terms'], data);

      await expect(paused).rejects.toThrow(
        /Converting attachments is paused .* timed out/
      );
      await expect(paused).rejects.toBeInstanceOf(MailAttachmentError);
      expect(pdfRenderer.convertDocument).not.toHaveBeenCalled();
    });

    it('tries again after the pause, and goes on once that works', async () => {
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.convertDocument.mockRejectedValue(
        new PdfRendererError('timed out')
      );
      await failInARow(renderer, CONVERSION_FAILURES_BEFORE_PAUSE);

      vi.setSystemTime(Date.now() + CONVERSION_PAUSE_MS);
      pdfRenderer.convertDocument.mockResolvedValue(Buffer.from('%PDF-ok'));

      await expect(renderer.render(['terms'], data)).resolves.toHaveLength(1);
      await expect(renderer.render(['contract'], data)).resolves.toHaveLength(
        1
      );
    });

    it('pauses again at once when the first try after the pause fails', async () => {
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.convertDocument.mockRejectedValue(
        new PdfRendererError('timed out')
      );
      await failInARow(renderer, CONVERSION_FAILURES_BEFORE_PAUSE);

      vi.setSystemTime(Date.now() + CONVERSION_PAUSE_MS);
      await failInARow(renderer, 1);
      pdfRenderer.convertDocument.mockClear();

      await expect(renderer.render(['terms'], data)).rejects.toThrow(/paused/);
      expect(pdfRenderer.convertDocument).not.toHaveBeenCalled();
    });

    it('does not pause for failures with a success in between', async () => {
      const { renderer, pdfRenderer } = setup();
      pdfRenderer.convertDocument.mockRejectedValue(
        new PdfRendererError('timed out')
      );
      await failInARow(renderer, CONVERSION_FAILURES_BEFORE_PAUSE - 1);
      pdfRenderer.convertDocument.mockResolvedValueOnce(Buffer.from('%PDF-ok'));
      await renderer.render(['contract'], data);
      await failInARow(renderer, CONVERSION_FAILURES_BEFORE_PAUSE - 1);
      pdfRenderer.convertDocument.mockClear();

      await expect(renderer.render(['terms'], data)).rejects.toThrow(
        'timed out'
      );
      expect(pdfRenderer.convertDocument).toHaveBeenCalledTimes(1);
    });
  });

  it('refuses attachments too large together for a mail to carry', async () => {
    // Mail providers cap a message at about 25 MB, and base64 adds a third.
    const { renderer, pdfRenderer } = setup();
    const half = Buffer.alloc(MAX_ATTACHMENT_BYTES / 2 + 1);
    half.write('%PDF-');
    pdfRenderer.convertDocument.mockResolvedValue(half);

    const failure = renderer.render(['contract', 'terms'], data);

    await expect(failure).rejects.toThrow(/too large/);
    await expect(failure).rejects.toBeInstanceOf(MailAttachmentError);
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

describe('RecentCache', () => {
  const bytes = (size: number) => new Uint8Array(size);

  function cache(limits: { entries: number; bytes: number }) {
    const loads: string[] = [];
    const recent = new RecentCache<Uint8Array>(limits, value => value.length);
    const get = (key: string, size = 1) =>
      recent.get(key, async () => {
        loads.push(key);

        return bytes(size);
      });

    return { get, loads };
  }

  it('keeps the latest entries, up to their number', async () => {
    const { get, loads } = cache({ entries: 2, bytes: 100 });

    await get('a');
    await get('b');
    await get('a');
    await get('c');
    await get('a');
    await get('b');

    expect(loads).toEqual(['a', 'b', 'c', 'b']);
  });

  it('drops the least recently used entries once they hold too many bytes', async () => {
    const { get, loads } = cache({ entries: 10, bytes: 10 });

    await get('a', 4);
    await get('b', 4);
    await get('a', 4);
    await get('c', 4);
    await get('a', 4);
    await get('b', 4);

    expect(loads).toEqual(['a', 'b', 'c', 'b']);
  });

  it('does not keep a value larger than all it may hold', async () => {
    const { get, loads } = cache({ entries: 10, bytes: 10 });

    await get('small', 4);
    await get('huge', 11);
    await get('huge', 11);
    await get('small', 4);

    expect(loads).toEqual(['small', 'huge', 'huge']);
  });

  it('drops a failed load, so the next caller tries again', async () => {
    const recent = new RecentCache<Uint8Array>(
      { entries: 10, bytes: 10 },
      value => value.length
    );
    const load = vi
      .fn<() => Promise<Uint8Array>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(bytes(1));

    await expect(recent.get('a', load)).rejects.toThrow('down');
    await expect(recent.get('a', load)).resolves.toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(2);
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
