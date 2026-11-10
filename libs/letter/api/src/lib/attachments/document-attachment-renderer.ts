import { Document, PrismaClient } from '@prisma/client';
import { MailAttachment, MailAttachmentRenderer } from '@wepublish/mail/api';
import {
  enrichTemplateData,
  extractDocxPlaceholders,
  renderDocxTemplate,
} from '@wepublish/template/api';
import { createHash } from 'crypto';
import { PdfRenderer } from '../pdf/pdf-renderer';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Uploaded files kept in memory, so a send job downloads each one once. */
const MAX_DOWNLOADS = 20;

/**
 * Converted pdfs kept in memory. Only a document that reads the same for
 * every recipient hits this, but that one would otherwise be converted once
 * per mail of a send job.
 */
const MAX_CONVERSIONS = 20;

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
 * Holds on to the latest few results of a load. A failed load is dropped, so
 * the next caller tries again.
 */
class RecentCache<T> {
  private readonly entries = new Map<string, Promise<T>>();

  constructor(private readonly size: number) {}

  get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);

    if (cached) {
      this.entries.delete(key);
      this.entries.set(key, cached);

      return cached;
    }

    const loading = load();
    loading.catch(() => {
      if (this.entries.get(key) === loading) {
        this.entries.delete(key);
      }
    });

    this.entries.set(key, loading);

    if (this.entries.size > this.size) {
      this.entries.delete(this.entries.keys().next().value as string);
    }

    return loading;
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

  // Uploaded documents never change under their id.
  private readonly downloads = new RecentCache<Uint8Array>(MAX_DOWNLOADS);
  private readonly conversions = new RecentCache<Buffer>(MAX_CONVERSIONS);

  constructor(props: DocumentAttachmentRendererProps) {
    this.prisma = props.prisma;
    this.pdfRenderer = props.pdfRenderer;
    this.documentUrl = props.documentUrl;
  }

  async render(
    documentIds: string[],
    data: Record<string, unknown>
  ): Promise<MailAttachment[]> {
    if (!documentIds.length) {
      return [];
    }

    const documents = await this.load(documentIds);
    const enriched = enrichTemplateData(data);
    const attachments: MailAttachment[] = [];

    // One after the other: the renderer converts one office document at a
    // time anyway, and a failure stops the rest.
    for (const document of documents) {
      try {
        const filled = renderDocxTemplate(
          await this.download(document.id),
          enriched
        );

        attachments.push({
          filename: attachmentFilename(document),
          contentType: 'application/pdf',
          content: await this.convert(filled),
        });
      } catch (error) {
        throw new Error(
          `Attachment "${displayName(document)}" could not be rendered: ${
            (error as Error).message
          }`,
          { cause: error }
        );
      }
    }

    return attachments;
  }

  /** The distinct placeholders the documents use, for a check before a send. */
  async placeholders(documentIds: string[]): Promise<string[]> {
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
      // Gotenberg picks the converter by the extension.
      this.pdfRenderer.convertDocument(docx, 'document.docx')
    );
  }
}
