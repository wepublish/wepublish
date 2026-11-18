import { Prisma } from '@prisma/client';

/** A file sent along with a mail. */
export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

/**
 * Injection token for whoever turns the documents attached to a template into
 * files. The mail lib only knows the token; the letter lib, which owns the pdf
 * renderer, provides it. Optional, so an installation without one keeps
 * mailing templates that carry no attachments.
 */
export const MAIL_ATTACHMENT_RENDERER = 'MAIL_ATTACHMENT_RENDERER';

export interface MailAttachmentRenderer {
  /**
   * The documents, filled in with the mail data like the template itself and
   * converted to pdf, in the order given. `data` is the raw mail data, as
   * `composeMail` takes it. Throws if any of them cannot be rendered: a mail
   * must not go out without the documents it promises.
   */
  render(
    documentIds: string[],
    data: Record<string, unknown>
  ): Promise<MailAttachment[]>;
}

/** Load a template's attachments with it, in their order. */
export const MAIL_TEMPLATE_ATTACHMENT_IDS = {
  attachments: {
    select: { documentId: true },
    orderBy: { position: 'asc' },
  },
} as const satisfies Prisma.MailTemplateInclude;

/** The ids of the documents attached to a template loaded with them. */
export function attachmentIdsOf(template: {
  attachments?: { documentId: string }[];
}): string[] {
  return template.attachments?.map(({ documentId }) => documentId) ?? [];
}

/**
 * The documents attached to a mail could not be rendered, so the mail was not
 * sent. It concerns the mails of one template only: a batch records it and
 * goes on with the next recipient.
 */
export class MailAttachmentError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'MailAttachmentError';
  }
}
