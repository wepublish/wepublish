import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  MailSendAudience,
  MailSendJob,
  MailSendJobState,
  MailTemplate,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import {
  assembleMailData,
  MailTemplateContextId,
} from '../mail-template/mail-template-data';
import { MailAudienceInput, MailRecipientBase } from './mail-send.model';
import {
  MailRecipient,
  MailSendRecipientService,
} from './mail-send-recipient.service';
import { findMissingPlaceholders } from './placeholder-check';

/** How many recipients are fetched and sent per drain iteration. */
const BATCH_SIZE = 100;

/**
 * A `running` job whose `startedAt` is older than this is considered
 * interrupted (e.g. process restart) and marked `failed` rather than resumed,
 * so recipients are never mailed twice.
 */
const STUCK_JOB_THRESHOLD_MS = 30 * 60 * 1000;

@Injectable()
export class MailSendJobService {
  private readonly logger = new Logger('MailSendJobService');
  private draining = false;

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private recipientService: MailSendRecipientService
  ) {}

  /**
   * Manually send a template to a single user. Only `custom`-context templates
   * are allowed here (no subscription data can be bound for an arbitrary user).
   */
  async sendToUser(
    templateId: string,
    userId: string,
    currentUserId: string
  ): Promise<MailSendJob> {
    const template = await this.loadTemplate(templateId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const job = await this.prisma.mailSendJob.create({
      data: {
        mailTemplateId: template.id,
        createdByUserId: currentUserId,
        audience: MailSendAudience.singleUser,
        status: MailSendJobState.running,
        startedAt: new Date(),
        totalCount: 1,
        recipientFilter: { userId } as Prisma.InputJsonValue,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    try {
      await this.sendOne(job.id, template, { user });
      sentCount = 1;
    } catch (error) {
      failedCount = 1;
      this.logger.error(
        `Manual mail to user ${userId} failed: ${(error as Error).message}`
      );
    }

    return this.prisma.mailSendJob.update({
      where: { id: job.id },
      data: {
        sentCount,
        failedCount,
        status: failedCount ? MailSendJobState.failed : MailSendJobState.done,
        finishedAt: new Date(),
        error: failedCount ? 'Delivery to the recipient failed.' : null,
      },
    });
  }

  /**
   * Create a background job that sends a template to a filtered audience, then
   * trigger an immediate drain. The `@Interval` executor re-drains queued jobs
   * as a safety net.
   */
  async createJob(
    input: { mailTemplateId: string; audience: MailAudienceInput },
    currentUserId: string
  ): Promise<MailSendJob> {
    const template = await this.loadTemplate(input.mailTemplateId);

    const totalCount = await this.recipientService.count(input.audience);

    const job = await this.prisma.mailSendJob.create({
      data: {
        mailTemplateId: template.id,
        createdByUserId: currentUserId,
        audience: this.audienceFor(input.audience),
        status: MailSendJobState.queued,
        totalCount,
        recipientFilter: input.audience as unknown as Prisma.InputJsonValue,
      },
    });

    // Fire-and-forget: the editor polls the job for progress.
    this.drain().catch(error =>
      this.logger.error(`Immediate drain failed: ${error.message}`)
    );

    return job;
  }

  /**
   * Process pending send jobs. Claims each `queued` job atomically (so the
   * immediate trigger and the interval never double-process), and fails
   * long-running interrupted jobs.
   */
  async drain(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;

    try {
      await this.failStuckJobs();

      const queued = await this.prisma.mailSendJob.findMany({
        where: { status: MailSendJobState.queued },
        orderBy: { createdAt: 'asc' },
      });

      for (const job of queued) {
        const claimed = await this.claim(job.id);
        if (claimed) {
          await this.processJob(job.id);
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async failStuckJobs(): Promise<void> {
    const threshold = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);

    await this.prisma.mailSendJob.updateMany({
      where: {
        status: MailSendJobState.running,
        startedAt: { lt: threshold },
      },
      data: {
        status: MailSendJobState.failed,
        error: 'Job was interrupted and did not finish.',
        finishedAt: new Date(),
      },
    });
  }

  /** Atomically move a queued job to running. Returns false if already taken. */
  private async claim(jobId: string): Promise<boolean> {
    const { count } = await this.prisma.mailSendJob.updateMany({
      where: { id: jobId, status: MailSendJobState.queued },
      data: { status: MailSendJobState.running, startedAt: new Date() },
    });

    return count === 1;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = await this.prisma.mailSendJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return;
    }

    let template: MailTemplate;
    try {
      template = await this.loadTemplate(job.mailTemplateId);
    } catch (error) {
      await this.prisma.mailSendJob.update({
        where: { id: jobId },
        data: {
          status: MailSendJobState.failed,
          error: (error as Error).message,
          finishedAt: new Date(),
        },
      });
      return;
    }

    const audience = job.recipientFilter as unknown as MailAudienceInput;
    let sentCount = 0;
    let failedCount = 0;
    let skip = 0;

    for (;;) {
      const recipients = await this.recipientService.resolvePage(
        audience,
        skip,
        BATCH_SIZE
      );

      if (recipients.length === 0) {
        break;
      }

      for (const recipient of recipients) {
        try {
          await this.sendOne(jobId, template, recipient);
          sentCount++;
        } catch (error) {
          failedCount++;
          this.logger.warn(
            `Job ${jobId}: failed to mail ${recipient.user.email}: ${
              (error as Error).message
            }`
          );
        }
      }

      await this.prisma.mailSendJob.update({
        where: { id: jobId },
        data: { sentCount, failedCount },
      });

      skip += BATCH_SIZE;
    }

    await this.prisma.mailSendJob.update({
      where: { id: jobId },
      data: {
        sentCount,
        failedCount,
        status: MailSendJobState.done,
        finishedAt: new Date(),
      },
    });
  }

  /** Send the template to one recipient and record the MailLog row. */
  private async sendOne(
    mailSendJobId: string,
    template: MailTemplate,
    recipient: MailRecipient
  ): Promise<void> {
    const optionalData = await this.buildOptionalData(template, recipient);

    await this.mailContext.sendMail({
      mailTemplateId: template.id,
      recipient: recipient.user,
      optionalData,
      mailType: mailLogType.Manual,
      mailSendJobId,
      isRetry: false,
    });
  }

  /**
   * Subscription-context templates receive that recipient's subscription (plus
   * latest invoice) as `optional` data. Custom templates and user-only
   * recipients get an empty payload.
   */
  private async buildOptionalData(
    template: MailTemplate,
    recipient: MailRecipient
  ): Promise<Record<string, unknown>> {
    if (!recipient.subscription) {
      return {};
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { subscriptionID: recipient.subscription.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return assembleMailData(
      this.contextId(template),
      { user: recipient.user, subscription: recipient.subscription, invoice },
      ''
    ).optional;
  }

  /**
   * The placeholders a template uses that would render empty for a given send.
   * `withSubscriptionData` should reflect whether the chosen audience carries a
   * subscription per recipient. Used by the editor to warn before sending.
   */
  async missingPlaceholders(
    templateId: string,
    withSubscriptionData: boolean
  ): Promise<string[]> {
    const template = await this.loadTemplate(templateId);

    return findMissingPlaceholders(template, withSubscriptionData);
  }

  private audienceFor(audience: MailAudienceInput): MailSendAudience {
    return audience.base === MailRecipientBase.allUsers ?
        MailSendAudience.allUsers
      : MailSendAudience.filteredSubscriptions;
  }

  private contextId(template: MailTemplate): MailTemplateContextId {
    return (template.context ?? 'custom') as MailTemplateContextId;
  }

  private async loadTemplate(id: string): Promise<MailTemplate> {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new BadRequestException('Mail template not found.');
    }

    return template;
  }
}
