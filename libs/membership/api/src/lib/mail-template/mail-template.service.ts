import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  LetterAddressPosition,
  MailChannel,
  MailTemplate,
  MailTemplateContext,
  PrismaClient,
} from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { v7 as uuidv7 } from 'uuid';
import {
  composeMail,
  convertMandrillPlaceholders,
  deriveComputedFields,
  deriveDateFormats,
  flattenMailData,
  MailContext,
  MailTemplateContent,
} from '@wepublish/mail/api';
import {
  LetterAddress,
  LetterAddressError,
  LetterContext,
  toLetterAddress,
} from '@wepublish/letter/api';
import {
  assembleMailData,
  assembleSampleMailData,
  MailTemplateContextId,
  MAIL_TEMPLATE_CONTEXT_IDS,
  SAMPLE_JWT,
  SAMPLE_LETTER_ADDRESS,
} from './mail-template-data';
import {
  MailTemplateInput,
  MailTemplateVariantInput,
} from './mail-template.model';

/**
 * Mail types that are a link to click: a login, a confirmed address. Printed
 * and posted they arrive days late and cannot be clicked, so they have no
 * letter version.
 */
const CONTEXTS_WITHOUT_LETTER: MailTemplateContext[] = [
  MailTemplateContext.account,
  MailTemplateContext.emailChange,
];

/**
 * A version as it is stored: an email has no stationery, a letter no
 * plain-text alternative.
 */
const variantData = (variant: MailTemplateVariantInput) => {
  const isLetter = variant.channel === MailChannel.letter;
  // A letter that says what the email says keeps no copy of it, so the two
  // cannot drift apart.
  const sameAsMail = isLetter && !!variant.sameAsMail;

  return {
    channel: variant.channel,
    subject: sameAsMail ? '' : variant.subject,
    htmlContent: sameAsMail ? '' : variant.htmlContent,
    textContent: isLetter ? null : (variant.textContent ?? null),
    sameAsMail,
    letterLayoutId: isLetter ? (variant.letterLayoutId ?? null) : null,
    letterAppendixId: isLetter ? (variant.letterAppendixId ?? null) : null,
  };
};

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
    private features: FeaturesService
  ) {}

  /** A template with what it says on each channel it is written for. */
  async createMailTemplate(input: MailTemplateInput): Promise<MailTemplate> {
    if (!input.variants.length) {
      throw new BadRequestException(
        'A template needs at least one version to send.'
      );
    }

    await this.assertVariantsAllowed(input.variants, input.context, []);

    return this.prisma.mailTemplate.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        context: input.context ?? null,
        variants: { create: input.variants.map(variantData) },
      },
    });
  }

  /**
   * Save the shared fields and the versions handed in. A version left out is
   * left alone: the editor hides the letter while letters are switched off,
   * and saving then must not throw the letter away. Removing a version is
   * `deleteMailTemplateVariant`, which knows what still depends on it.
   */
  async updateMailTemplate(
    id: string,
    input: MailTemplateInput
  ): Promise<MailTemplate> {
    const existing = await this.prisma.mailTemplateVariant.findMany({
      where: { templateId: id },
      select: { channel: true },
    });

    await this.assertVariantsAllowed(
      input.variants,
      input.context,
      existing.map(({ channel }) => channel)
    );

    return this.prisma.mailTemplate.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        context: input.context ?? null,
        variants: {
          upsert: input.variants.map(variant => ({
            where: {
              templateId_channel: { templateId: id, channel: variant.channel },
            },
            create: variantData(variant),
            update: variantData(variant),
          })),
        },
      },
    });
  }

  private async assertVariantsAllowed(
    variants: MailTemplateVariantInput[],
    context: MailTemplateContext | null | undefined,
    existingChannels: MailChannel[]
  ): Promise<void> {
    const channels = variants.map(({ channel }) => channel);

    if (new Set(channels).size !== channels.length) {
      throw new BadRequestException(
        'A template has one version per channel at most.'
      );
    }

    if (
      channels.includes(MailChannel.letter) &&
      !(await this.features.isEnabled('paper-letters'))
    ) {
      throw new ForbiddenException('Letters are not enabled for this medium.');
    }

    for (const variant of variants) {
      if (!variant.sameAsMail) {
        continue;
      }

      if (variant.channel !== MailChannel.letter) {
        throw new BadRequestException(
          'Only a letter version can take its text from the email.'
        );
      }

      if (![...channels, ...existingChannels].includes(MailChannel.mail)) {
        throw new BadRequestException(
          'A letter that takes its text from the email needs an email version.'
        );
      }
    }

    if (
      context &&
      CONTEXTS_WITHOUT_LETTER.includes(context) &&
      [...channels, ...existingChannels].includes(MailChannel.letter)
    ) {
      throw new BadRequestException(
        'A template of this mail type cannot have a letter version.'
      );
    }
  }

  /**
   * Remove what a template says on one channel, unless something still sends
   * it there: flows and system mails always mail, and an event switched to
   * letters prints.
   */
  async deleteMailTemplateVariant(
    templateId: string,
    channel: MailChannel
  ): Promise<void> {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: templateId },
      select: {
        variants: { select: { channel: true, sameAsMail: true } },
        _count: {
          select: { subscriptionIntervals: true, userFlowMails: true },
        },
      },
    });

    if (!template) {
      throw new BadRequestException('Mail template not found.');
    }

    if (!template.variants.some(variant => variant.channel === channel)) {
      throw new BadRequestException(
        'This template has no version for that channel.'
      );
    }

    if (template.variants.length === 1) {
      throw new BadRequestException(
        'This is the only version of the template. Delete the template instead.'
      );
    }

    if (channel === MailChannel.mail) {
      if (template.variants.some(variant => variant.sameAsMail)) {
        throw new BadRequestException(
          'The letter version takes its text from the email. Give the letter a text of its own before removing the email version.'
        );
      }

      if (template._count.subscriptionIntervals > 0) {
        throw new BadRequestException(
          'This template is still assigned to a subscription flow, which always sends the email. Please unassign it before removing the email version.'
        );
      }

      if (template._count.userFlowMails > 0) {
        throw new BadRequestException(
          'This template is still assigned to a system mail. Please unassign it before removing the email version.'
        );
      }
    }

    if (
      channel === MailChannel.letter &&
      (await this.prisma.subscriptionInterval.count({
        where: { mailTemplateId: templateId, sendAsLetter: true },
      })) > 0
    ) {
      throw new BadRequestException(
        'A subscription flow still sends this template as a letter. Please switch the letter off there before removing the letter version.'
      );
    }

    await this.prisma.mailTemplateVariant.delete({
      where: { templateId_channel: { templateId, channel } },
    });
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

      const existing = await this.prisma.mailTemplate.findUnique({
        where: { externalMailTemplateId: remote.externalId },
        select: { id: true },
      });

      if (!existing) {
        await this.prisma.mailTemplate.create({
          data: {
            name: remote.name,
            externalMailTemplateId: remote.externalId,
            variants: {
              create: {
                channel: MailChannel.mail,
                htmlContent,
                subject: subject ?? '',
              },
            },
          },
        });
      } else {
        // A provider only knows emails: a letter version written since is
        // not its to overwrite.
        await this.prisma.mailTemplateVariant.upsert({
          where: {
            templateId_channel: {
              templateId: existing.id,
              channel: MailChannel.mail,
            },
          },
          create: {
            templateId: existing.id,
            channel: MailChannel.mail,
            htmlContent,
            subject: subject ?? '',
          },
          // Providers without a remote subject (e.g. Mailgun) must not blank
          // the local one.
          update: { htmlContent, ...(subject ? { subject } : {}) },
        });
      }
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
