import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { LetterAddressPosition, Prisma, PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import {
  composeMail,
  convertMandrillPlaceholders,
  deriveComputedFields,
  deriveDateFormats,
  flattenMailData,
  MAIL_TEMPLATE_ATTACHMENT_IDS,
  MailContext,
  MailTemplateContent,
} from '@wepublish/mail/api';
import {
  DocumentAttachmentRenderer,
  DOCX_MIME_TYPE,
  LetterAddress,
  LetterAddressError,
  LetterContext,
  MAX_ATTACHMENT_BYTES,
  MAX_TEMPLATE_ATTACHMENTS,
  toLetterAddress,
} from '@wepublish/letter/api';
import { MailTemplateInput } from './mail-template.model';
import {
  assembleMailData,
  assembleSampleMailData,
  MailTemplateContextId,
  MAIL_TEMPLATE_CONTEXT_IDS,
  SAMPLE_JWT,
  SAMPLE_LETTER_ADDRESS,
} from './mail-template-data';

export interface PreviewResult {
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailTemplateService {
  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private letterContext: LetterContext,
    private attachments: DocumentAttachmentRenderer
  ) {}

  async createMailTemplate({ attachmentIds, ...input }: MailTemplateInput) {
    await this.assertAttachable(attachmentIds);

    return this.prisma.mailTemplate.create({
      data: {
        ...input,
        ...(attachmentIds ?
          { attachments: { create: this.attachmentRows(attachmentIds) } }
        : {}),
      },
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
    });
  }

  /** Without `attachmentIds` the attachments stay as they are. */
  async updateMailTemplate(
    id: string,
    { attachmentIds, ...input }: MailTemplateInput
  ) {
    await this.assertAttachable(attachmentIds, id);

    return this.prisma.mailTemplate.update({
      where: { id },
      data: {
        ...input,
        ...(attachmentIds ?
          {
            attachments: {
              deleteMany: {},
              create: this.attachmentRows(attachmentIds),
            },
          }
        : {}),
      },
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
    });
  }

  private attachmentRows(
    attachmentIds: string[]
  ): Prisma.MailTemplateAttachmentUncheckedCreateWithoutMailTemplateInput[] {
    return attachmentIds.map((documentId, position) => ({
      documentId,
      position,
    }));
  }

  /**
   * Only what every mail of the template can carry is let through: Word
   * documents, which only a renderer that converts them (Gotenberg) can fill
   * in, few and small enough for a mail, and none on a template sent as a
   * system mail, which someone waits for (a login link, a password reset).
   * Attachments ship dark with the letters.
   */
  private async assertAttachable(
    attachmentIds?: string[] | null,
    templateId?: string
  ) {
    if (!attachmentIds?.length) {
      return;
    }

    if (!(await this.attachments.isAvailable())) {
      throw new ForbiddenException(
        'Mail attachments are not available for this medium: they need paper letters and a pdf renderer that converts Word documents (Gotenberg).'
      );
    }

    if (templateId) {
      const systemMail = await this.prisma.userFlowMail.findFirst({
        where: { mailTemplateId: templateId },
        select: { event: true },
      });

      if (systemMail) {
        throw new BadRequestException(
          `This template is sent as the system mail ${systemMail.event}, which must not wait for attachments. Use another template for mails with attachments.`
        );
      }
    }

    if (attachmentIds.length > MAX_TEMPLATE_ATTACHMENTS) {
      throw new BadRequestException(
        `A template can attach at most ${MAX_TEMPLATE_ATTACHMENTS} documents.`
      );
    }

    if (new Set(attachmentIds).size !== attachmentIds.length) {
      throw new BadRequestException('A document can be attached only once.');
    }

    const documents = await this.prisma.document.findMany({
      where: { id: { in: attachmentIds } },
      select: {
        id: true,
        title: true,
        filename: true,
        mimeType: true,
        fileSize: true,
      },
    });

    for (const id of attachmentIds) {
      const document = documents.find(candidate => candidate.id === id);

      if (!document) {
        throw new BadRequestException(`Document <${id}> not found.`);
      }

      if (document.mimeType !== DOCX_MIME_TYPE) {
        throw new BadRequestException(
          `"${
            document.title || document.filename || id
          }" is not a Word document (.docx); only those can be attached.`
        );
      }
    }

    // The pdfs come out about as large as the Word files; the send checks the
    // pdfs themselves.
    if (
      documents.reduce((bytes, { fileSize }) => bytes + fileSize, 0) >
      MAX_ATTACHMENT_BYTES
    ) {
      throw new BadRequestException(
        `The documents are too large together for a mail: at most ${
          MAX_ATTACHMENT_BYTES / 1024 / 1024
        } MB.`
      );
    }
  }

  /**
   * Delete a template, but refuse if it is still wired to a subscription flow
   * or a system mail, or if it has already sent mails (referenced by logs).
   */
  async deleteMailTemplate(id: string): Promise<void> {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptionIntervals: true,
            userFlowMails: true,
            mailLog: true,
          },
        },
      },
    });

    if (!template) {
      throw new BadRequestException('Mail template not found.');
    }

    if (template._count.subscriptionIntervals > 0) {
      throw new BadRequestException(
        'This template is still assigned to a subscription flow. Please unassign it before deleting.'
      );
    }

    if (template._count.userFlowMails > 0) {
      throw new BadRequestException(
        'This template is still assigned to a system mail. Please unassign it before deleting.'
      );
    }

    if (template._count.mailLog > 0) {
      throw new BadRequestException(
        'This template has already sent mails and cannot be deleted.'
      );
    }

    await this.prisma.mailTemplate.delete({ where: { id } });
  }

  /**
   * Pull every template the mail provider hosts into the local store: unknown
   * ones are created, ones already linked by `externalMailTemplateId` get their
   * HTML and subject overwritten. Used to migrate installs from the
   * remote-template model.
   *
   * The local `name` and `context` are only set on creation — a template that
   * was already imported keeps whatever the editor renamed/classified it as.
   */
  async importFromProvider(): Promise<number> {
    const remoteTemplates = await this.mailContext.mailProvider.listTemplates();

    let imported = 0;
    for (const remote of remoteTemplates) {
      // Provider templates (e.g. Mandrill) use `*|NAME|*` merge tags; convert
      // them to our `{{ name }}` syntax so the local engine renders them.
      const htmlContent = convertMandrillPlaceholders(remote.html);
      const subject =
        remote.subject ?
          convertMandrillPlaceholders(remote.subject)
        : undefined;

      await this.prisma.mailTemplate.upsert({
        where: { externalMailTemplateId: remote.externalId },
        create: {
          name: remote.name,
          externalMailTemplateId: remote.externalId,
          htmlContent,
          subject: subject ?? '',
        },
        // Providers without a remote subject (e.g. Mailgun) must not blank the
        // local one.
        update: { htmlContent, ...(subject ? { subject } : {}) },
      });
      imported++;
    }

    return imported;
  }

  /**
   * Build the `{ user, optional, jwt, currentDate }` data for a context, from a real
   * subscription or sample. The JWT is ALWAYS generated for the current editor
   * (never the subscription's user) — a test mail must only ever contain a
   * login token for the person triggering it.
   */
  private async buildData(
    contextId: MailTemplateContextId,
    subscriptionId: string | null | undefined,
    currentUserId: string | null | undefined
  ) {
    const jwt =
      currentUserId ?
        await this.mailContext.jwtGenerator(currentUserId)
      : SAMPLE_JWT;

    if (!subscriptionId) {
      return { ...assembleSampleMailData(contextId), jwt };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        // The address is only read by a letter preview, which addresses the
        // sheet to this user.
        user: { include: { address: true } },
        memberPlan: true,
        paymentMethod: true,
        deactivation: true,
        periods: true,
      },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found.');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { subscriptionID: subscriptionId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return assembleMailData(
      contextId,
      { user: subscription.user ?? {}, subscription, invoice },
      jwt
    );
  }

  private toContent(input: {
    subject: string;
    html: string;
    text?: string | null;
  }): MailTemplateContent {
    return {
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text ?? null,
    };
  }

  /** Render a draft template with a context's data (real subscription or sample). */
  async preview(input: {
    contextId: MailTemplateContextId;
    subscriptionId?: string | null;
    currentUserId?: string | null;
    subject: string;
    html: string;
    text?: string | null;
  }): Promise<PreviewResult> {
    const data = await this.buildData(
      input.contextId,
      input.subscriptionId,
      input.currentUserId
    );
    const composed = composeMail(this.toContent(input), data);

    return {
      subject: composed.subject,
      html: composed.messageHtml,
      text: composed.message,
    };
  }

  /**
   * Whether letters can be offered at all: a letter provider and a pdf renderer
   * are both set up with their credentials.
   */
  isLetterChannelAvailable(): Promise<boolean> {
    return this.letterContext.isConfigured();
  }

  /**
   * Render a draft template as the letter a send would print, through the same
   * pdf renderer. Addressed to the chosen subscription's user, or to a sample
   * address when previewing with sample data.
   */
  async previewLetter(input: {
    contextId: MailTemplateContextId;
    subscriptionId?: string | null;
    currentUserId?: string | null;
    html: string;
    /** Stationery chosen in the editor, possibly not saved yet. */
    letterLayoutId?: string | null;
    /** Uploaded pdf chosen in the editor, possibly not saved yet. */
    letterAppendixId?: string | null;
    /** Attachments chosen in the editor, possibly not saved yet. */
    attachmentIds?: string[] | null;
  }): Promise<{ pdf: string }> {
    const data = await this.buildData(
      input.contextId,
      input.subscriptionId,
      input.currentUserId
    );

    const pdf = await this.letterContext.renderLetter({
      template: {
        htmlContent: input.html,
        letterAppendixId: input.letterAppendixId,
        attachmentIds: input.attachmentIds,
      },
      layout: await this.letterContext.resolveLayout(input.letterLayoutId),
      // The window position is chosen per send; a preview shows the default.
      addressPosition: LetterAddressPosition.left,
      data,
      recipient:
        input.subscriptionId ?
          this.letterAddressOf(data.user)
        : SAMPLE_LETTER_ADDRESS,
    });

    return { pdf: pdf.toString('base64') };
  }

  private letterAddressOf(user: any): LetterAddress {
    try {
      return toLetterAddress(user);
    } catch (error) {
      if (error instanceof LetterAddressError) {
        throw new BadRequestException(
          `${user.email ?? user.id} has no usable postal address.`
        );
      }

      throw error;
    }
  }

  /**
   * Compose a draft with a context's data and send it as a test mail. The
   * recipient is always the current editor (enforced by the resolver) and the
   * JWT is generated for that same user.
   */
  async sendTest(input: {
    contextId: MailTemplateContextId;
    subscriptionId?: string | null;
    currentUserId: string;
    recipient: string;
    subject: string;
    html: string;
    text?: string | null;
    /** Attachments chosen in the editor, possibly not saved yet. */
    attachmentIds?: string[] | null;
  }): Promise<void> {
    const data = await this.buildData(
      input.contextId,
      input.subscriptionId,
      input.currentUserId
    );

    await this.mailContext.sendComposedContent({
      mailLogID: uuidv7(),
      recipient: input.recipient,
      data,
      attachmentIds: input.attachmentIds ?? [],
      content: this.toContent({
        ...input,
        subject: `[Test] ${input.subject}`,
      }),
    });
  }

  /**
   * Authoritative list of placeholder keys (+ example values) per context,
   * derived from the real flatten/derive pipeline over sample data. This is the
   * single source of truth the editor's curated list is checked against.
   */
  getPlaceholderKeysByContext(): {
    contextId: MailTemplateContextId;
    keys: { key: string; example: string }[];
  }[] {
    return MAIL_TEMPLATE_CONTEXT_IDS.map(contextId => {
      const data = assembleSampleMailData(contextId);
      const flattened = flattenMailData(data);
      const enriched = {
        ...flattened,
        ...deriveDateFormats(flattened),
        ...deriveComputedFields(data),
      };

      return {
        contextId,
        keys: Object.entries(enriched).map(([key, value]) => ({
          key,
          example: String(value),
        })),
      };
    });
  }
}
