import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
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
  assembleMailData,
  assembleSampleMailData,
  MailTemplateContextId,
  MAIL_TEMPLATE_CONTEXT_IDS,
  SAMPLE_JWT,
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
    private mailContext: MailContext
  ) {}

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
   * Import HTML + subject for every template that still has a remote provider
   * id, overwriting the local content. Used to migrate installs from the
   * remote-template model. Templates whose remote fetch fails are skipped.
   */
  async importFromProvider(): Promise<number> {
    const templates = await this.prisma.mailTemplate.findMany({
      where: { externalMailTemplateId: { not: null } },
    });

    let imported = 0;
    for (const template of templates) {
      if (!template.externalMailTemplateId) {
        continue;
      }
      try {
        const content = await this.mailContext.mailProvider.getTemplateContent(
          template.externalMailTemplateId
        );
        await this.prisma.mailTemplate.update({
          where: { id: template.id },
          data: {
            // Provider templates (e.g. Mandrill) use `*|NAME|*` merge tags;
            // convert them to our `{{ name }}` syntax so the local engine
            // renders them.
            htmlContent: convertMandrillPlaceholders(content.html),
            subject:
              content.subject ?
                convertMandrillPlaceholders(content.subject)
              : template.subject,
          },
        });
        imported++;
      } catch {
        // Skip templates that no longer exist remotely or fail to load.
      }
    }

    return imported;
  }

  /**
   * Build the `{ user, optional, jwt }` data for a context, from a real
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
        user: true,
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
      mailLogID: randomUUID(),
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
