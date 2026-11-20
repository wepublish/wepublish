import { Document, PrismaClient } from '@prisma/client';
import {
  MailAttachment,
  MailAttachmentError,
  MailAttachmentRenderer,
} from '@wepublish/mail/api';
import {
  enrichTemplateData,
  extractDocxPlaceholders,
  renderDocxTemplate,
} from '@wepublish/template/api';
import { createHash } from 'crypto';
import { PdfRenderer } from '../pdf/pdf-renderer';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const MB = 1024 * 1024;

/**
 * Uploaded files kept in memory, so a send job downloads each one once. Each
 * API instance holds this much at most.
 */
const DOWNLOAD_CACHE = { entries: 20, bytes: 50 * MB };

/**
 * Converted pdfs kept in memory. Only a document that reads the same for
 * every recipient hits this, but that one would otherwise be converted once
 * per mail of a send job.
 */
const CONVERSION_CACHE = { entries: 20, bytes: 50 * MB };

/**
 * What the pdfs of one mail may weigh together. Mailgun and Mandrill refuse a
 * message over about 25 MB, and base64 makes an attachment a third larger.
 */
export const MAX_ATTACHMENT_BYTES = 15 * MB;

/**
 * How many documents a template may attach. Each is a conversion per mail, and
 * a mail with many attachments looks like spam to the receiving servers.
 */
export const MAX_TEMPLATE_ATTACHMENTS = 5;

/**
 * After this many failed conversions in a row the renderer is taken to be
 * down, and conversions are refused at once for {@link CONVERSION_PAUSE_MS}
 * instead of each waiting for its timeout.
 */
export const CONVERSION_FAILURES_BEFORE_PAUSE = 3;
export const CONVERSION_PAUSE_MS = 60 * 1000;

/**
 * Characters a mail client or file system refuses in a file name, besides the
 * control characters, which are dropped separately.
 */
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|]+/g;

const SOURCE_EXTENSION = /\.(docx|doc|odt|pdf)$/i;

export interface DocumentAttachmentRendererProps {
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
  /** Where an uploaded document can be downloaded. */
  documentUrl?: (documentId: string) => Promise<string>;
  /**
   * Whether the medium has attachments switched on. While it is off, nothing
   * is attached: a template keeps its documents, but nobody sees them in the
   * editor. On when left out.
   */
  enabled?: () => Promise<boolean>;
}

type AttachedDocument = Pick<
  Document,
  'id' | 'title' | 'filename' | 'mimeType'
>;

/** The name the pdf of a document is attached under. */
export function attachmentFilename(
  document: Pick<Document, 'id'> & Partial<Pick<Document, 'title' | 'filename'>>
): string {
  const name = Array.from(
    document.title?.trim() || document.filename?.trim() || ''
  )
    .map(character => (character < ' ' ? ' ' : character))
    .join('')
    .replace(SOURCE_EXTENSION, '')
    .replace(UNSAFE_FILENAME_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${name || document.id}.pdf`;
}

const displayName = (document: AttachedDocument) =>
  document.title || document.filename || document.id;

/**
 * Holds on to the latest few results of a load, within a number of entries
 * and of bytes. A value larger than all the bytes allowed is not kept. A failed
 * load is dropped, so the next caller tries again.
 */
export class RecentCache<T> {
  private readonly entries = new Map<
    string,
    { value: Promise<T>; bytes: number }
  >();
  private bytes = 0;

  constructor(
    private readonly limits: { entries: number; bytes: number },
    private readonly sizeOf: (value: T) => number
  ) {}

  get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);

    if (cached) {
      this.entries.delete(key);
      this.entries.set(key, cached);

      return cached.value;
    }

    const entry = { value: load(), bytes: 0 };
    const isCurrent = () => this.entries.get(key) === entry;

    entry.value.then(
      value => {
        if (!isCurrent()) {
          return;
        }

        entry.bytes = this.sizeOf(value);

        if (entry.bytes > this.limits.bytes) {
          this.entries.delete(key);

          return;
        }

        this.bytes += entry.bytes;
        this.evict();
      },
      () => {
        if (isCurrent()) {
          this.entries.delete(key);
        }
      }
    );

    this.entries.set(key, entry);
    this.evict();

    return entry.value;
  }

  /** Drops the least recently used entries until both limits hold. */
  private evict() {
    for (const [key, entry] of this.entries) {
      if (
        this.entries.size <= this.limits.entries &&
        this.bytes <= this.limits.bytes
      ) {
        return;
      }

      this.entries.delete(key);
      this.bytes -= entry.bytes;
    }
  }
}

/**
 * Refuses conversions for a while once enough of them failed in a row, so a
 * renderer that is down fails each mail at once rather than after its timeout.
 * The first conversion after the pause is a try: it closes the pause if it
 * works, and opens it again if it does not.
 */
class ConversionBreaker {
  private failuresInARow = 0;
  private pausedUntil = 0;
  private lastFailure = '';

  async run<T>(convert: () => Promise<T>): Promise<T> {
    if (Date.now() < this.pausedUntil) {
      throw new Error(
        `Converting attachments is paused until ${new Date(
          this.pausedUntil
        ).toISOString()} after ${this.failuresInARow} failed conversions in a row; the last: ${this.lastFailure}`
      );
    }

    try {
      const result = await convert();
      this.failuresInARow = 0;

      return result;
    } catch (error) {
      this.lastFailure = (error as Error).message;

      if (++this.failuresInARow >= CONVERSION_FAILURES_BEFORE_PAUSE) {
        this.pausedUntil = Date.now() + CONVERSION_PAUSE_MS;
      }

      throw error;
    }
  }
}

/**
 * Turns the Word documents attached to a mail template into the pdfs a mail
 * carries or a letter prints after its pages: each is filled in with the same
 * placeholders the template uses, then converted by the pdf renderer.
 */
export class DocumentAttachmentRenderer implements MailAttachmentRenderer {
  private readonly prisma: PrismaClient;
  private readonly pdfRenderer: PdfRenderer;
  private readonly documentUrl?: DocumentAttachmentRendererProps['documentUrl'];
  private readonly isEnabled: () => Promise<boolean>;

  // Uploaded documents never change under their id: only a document's title
  // and description can be edited.
  private readonly downloads = new RecentCache<Uint8Array>(
    DOWNLOAD_CACHE,
    file => file.byteLength
  );
  private readonly conversions = new RecentCache<Buffer>(
    CONVERSION_CACHE,
    pdf => pdf.byteLength
  );
  private readonly breaker = new ConversionBreaker();

  constructor(props: DocumentAttachmentRendererProps) {
    this.prisma = props.prisma;
    this.pdfRenderer = props.pdfRenderer;
    this.documentUrl = props.documentUrl;
    this.isEnabled = props.enabled ?? (async () => true);
  }

  /**
   * Whether attachments can be rendered at all: the medium has them switched
   * on, and its pdf renderer converts Word documents.
   */
  async isAvailable(): Promise<boolean> {
    if (!(await this.isEnabled())) {
      return false;
    }

    try {
      return await this.pdfRenderer.canConvertDocuments();
    } catch {
      // No pdf renderer is configured at all.
      return false;
    }
  }

  async render(
    documentIds: string[],
    data: Record<string, unknown>
  ): Promise<MailAttachment[]> {
    if (!documentIds.length || !(await this.isEnabled())) {
      return [];
    }

    const documents = await this.loadForMail(documentIds);
    const enriched = enrichTemplateData(data);
    const attachments: MailAttachment[] = [];
    let bytes = 0;

    // One after the other: the renderer converts one office document at a
    // time anyway, and a failure stops the rest.
    for (const document of documents) {
      let content: Buffer;

      try {
        content = await this.convert(
          renderDocxTemplate(await this.download(document.id), enriched)
        );
      } catch (error) {
        throw new MailAttachmentError(
          `Attachment "${displayName(document)}" could not be rendered: ${
            (error as Error).message
          }`,
          error
        );
      }

      bytes += content.byteLength;

      if (bytes > MAX_ATTACHMENT_BYTES) {
        throw new MailAttachmentError(
          `The attachments are too large for a mail: together they exceed ${
            MAX_ATTACHMENT_BYTES / MB
          } MB.`
        );
      }

      attachments.push({
        filename: attachmentFilename(document),
        contentType: 'application/pdf',
        content,
      });
    }

    return attachments;
  }

  /** The distinct placeholders the documents use, for a check before a send. */
  async placeholders(documentIds: string[]): Promise<string[]> {
    if (!documentIds.length || !(await this.isEnabled())) {
      return [];
    }

    const keys = new Set<string>();

    for (const document of await this.load(documentIds)) {
      for (const key of extractDocxPlaceholders(
        await this.download(document.id)
      )) {
        keys.add(key);
      }
    }

    return [...keys];
  }

  private async loadForMail(
    documentIds: string[]
  ): Promise<AttachedDocument[]> {
    try {
      return await this.load(documentIds);
    } catch (error) {
      throw new MailAttachmentError((error as Error).message, error);
    }
  }

  /** The documents in the order given, each checked to be a Word document. */
  private async load(documentIds: string[]): Promise<AttachedDocument[]> {
    if (!documentIds.length) {
      return [];
    }

    const found = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, title: true, filename: true, mimeType: true },
    });
    const byId = new Map(found.map(document => [document.id, document]));

    return documentIds.map(id => {
      const document = byId.get(id);

      if (!document) {
        throw new Error(`Attachment <${id}> no longer exists`);
      }

      if (document.mimeType !== DOCX_MIME_TYPE) {
        throw new Error(
          `Attachment "${displayName(document)}" is not a Word document (.docx)`
        );
      }

      return document;
    });
  }

  private download(documentId: string): Promise<Uint8Array> {
    return this.downloads.get(documentId, async () => {
      if (!this.documentUrl) {
        throw new Error('Mail attachments need a document storage');
      }

      const response = await fetch(await this.documentUrl(documentId));

      if (!response.ok) {
        throw new Error(`The download failed with status ${response.status}`);
      }

      return new Uint8Array(await response.arrayBuffer());
    });
  }

  private convert(docx: Uint8Array): Promise<Buffer> {
    const key = createHash('sha256').update(docx).digest('hex');

    return this.conversions.get(key, () =>
      this.breaker.run(() =>
        // Gotenberg picks the converter by the extension.
        this.pdfRenderer.convertDocument(docx, 'document.docx')
      )
    );
  }
}
