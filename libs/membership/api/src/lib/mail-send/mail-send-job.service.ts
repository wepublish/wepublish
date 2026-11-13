import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { FeaturesService } from '@wepublish/features/api';
import {
  MailChannel,
  MailSendAudience,
  MailSendJob,
  MailSendJobRecipient,
  MailSendJobRecipientState,
  MailSendJobState,
  MailTemplate,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import {
  attachmentIdsOf,
  composeMail,
  MAIL_TEMPLATE_ATTACHMENT_IDS,
  MailAttachmentError,
  MailContext,
  mailLogType,
} from '@wepublish/mail/api';
import {
  canReceiveLetters,
  DocumentAttachmentRenderer,
  LetterContext,
  printSettings,
  toLetterAddress,
} from '@wepublish/letter/api';
import {
  assembleMailData,
  MailTemplateContextId,
} from '../mail-template/mail-template-data';
import {
  LetterPrintInput,
  MailAudienceInput,
  MailRecipientBase,
} from './mail-send.model';
import {
  MailRecipient,
  MailSendRecipientService,
  recipientKey,
} from './mail-send-recipient.service';
import { findMissingPlaceholders } from './placeholder-check';

/** How many recipients are resolved per page while building the queue. */
const BATCH_SIZE = 100;

/** How many queued recipients are loaded per send round. */
const SEND_BATCH_SIZE = 25;

/** Write progress to the job row after this many recipients… */
const PROGRESS_EVERY = 10;

/**
 * …or once this much time has passed, whichever comes first: mails whose
 * attachments are converted one by one can take a minute each, and the
 * heartbeat must stay well inside {@link STALLED_AFTER_MS}.
 */
const PROGRESS_INTERVAL_MS = 60 * 1000;

/**
 * A job stops after this many mails in a row whose attachments could not be
 * rendered. They are the same documents for every mail, so the rest would
 * fail alike; the job can be continued once the cause is fixed.
 */
const ATTACHMENT_FAILURES_BEFORE_STOP = 3;

/**
 * A `running` job that has not reported progress for this long is considered
 * interrupted (process restart, lost connection) and is put back into the
 * queue. This is a stall timeout, not a runtime limit: a job that keeps
 * sending keeps its heartbeat fresh and may run for as long as it needs.
 */
const STALLED_AFTER_MS = 10 * 60 * 1000;

/**
 * How often a job may be picked up again automatically. Bounds a job that dies
 * reproducibly at the same recipient; the editor can still continue it by hand.
 */
const MAX_AUTO_RESUMES = 5;

const INTERRUPTED_ERROR = 'Job was interrupted and will be continued.';
const ABANDONED_ERROR =
  'Job was interrupted repeatedly and stopped. Continue it manually to send the remaining mails.';

export interface MailSendJobCounts {
  total: number;
  sent: number;
  failed: number;
  sending: number;
  pending: number;
}

@Injectable()
export class MailSendJobService {
  private readonly logger = new Logger('MailSendJobService');
  private draining = false;

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private letterContext: LetterContext,
    private recipientService: MailSendRecipientService,
    private features: FeaturesService,
    private attachments: DocumentAttachmentRenderer
  ) {}

  /**
   * Letters ship dark. The channel is an argument, so `@Feature` on the
   * resolver cannot see it; refuse here instead, for sends and previews alike.
   */
  private async assertChannelAllowed(channel?: MailChannel | null) {
    if (
      channel === MailChannel.letter &&
      !(await this.features.isEnabled('paper-letters'))
    ) {
      throw new ForbiddenException('Letters are not enabled for this medium.');
    }
  }

  /**
   * Manually send a template to a single user. Runs inline (one mail), but is
   * recorded as a job with one queue entry so it shows up and behaves like
   * every other send.
   */
  async sendToUser(
    templateId: string,
    userId: string,
    currentUserId: string
  ): Promise<MailSendJob> {
    const template = await this.loadTemplate(templateId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

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
        heartbeatAt: new Date(),
        totalCount: 1,
        recipientFilter: { userId } as Prisma.InputJsonValue,
        recipientsResolvedAt: new Date(),
        recipients: {
          create: [{ userId, position: 0 }],
        },
      },
      include: { recipients: true },
    });

    const [entry] = job.recipients;

    if (await this.claimRecipient(entry.id)) {
      await this.deliver(job, template, entry, { user });
    }

    return this.finish(job.id);
  }

  /**
   * Create a background job that sends a template to a filtered audience, then
   * trigger an immediate drain. The `@Interval` executor re-drains queued jobs
   * as a safety net.
   */
  async createJob(
    input: {
      mailTemplateId: string;
      audience: MailAudienceInput;
      channel?: MailChannel | null;
      print?: LetterPrintInput | null;
    },
    currentUserId: string
  ): Promise<MailSendJob> {
    await this.assertChannelAllowed(input.channel);

    const template = await this.loadTemplate(input.mailTemplateId);

    const totalCount = await this.recipientService.count(
      input.audience,
      input.channel
    );

    const job = await this.prisma.mailSendJob.create({
      data: {
        mailTemplateId: template.id,
        createdByUserId: currentUserId,
        audience: this.audienceFor(input.audience),
        channel: input.channel ?? MailChannel.mail,
        ...printSettings(input.print),
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
   * Put a job that stopped early back into the queue. Only recipients that were
   * never sent are picked up again, so continuing never mails anybody twice.
   *
   * `retryUnfinished` additionally re-opens recipients that failed and those
   * whose delivery was cut off mid-flight — for the latter it is unknown
   * whether the mail went out, which is why it takes a deliberate decision.
   */
  async resumeJob(
    jobId: string,
    retryUnfinished = false
  ): Promise<MailSendJob> {
    const job = await this.prisma.mailSendJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('Mail send job not found.');
    }

    if (
      job.status === MailSendJobState.running ||
      job.status === MailSendJobState.queued
    ) {
      throw new BadRequestException('Job is already running.');
    }

    if (retryUnfinished) {
      await this.prisma.mailSendJobRecipient.updateMany({
        where: {
          jobId,
          state: {
            in: [
              MailSendJobRecipientState.failed,
              MailSendJobRecipientState.sending,
            ],
          },
        },
        data: { state: MailSendJobRecipientState.pending, error: null },
      });
    }

    const resumed = await this.prisma.mailSendJob.update({
      where: { id: jobId },
      data: {
        status: MailSendJobState.queued,
        error: null,
        finishedAt: null,
        // A deliberate continue clears the automatic-resume budget.
        resumeCount: 0,
      },
    });

    this.drain().catch(error =>
      this.logger.error(`Drain after resume failed: ${error.message}`)
    );

    return resumed;
  }

  /**
   * Stop a job. The send loop notices between two recipients, so at most the
   * mail currently in flight still goes out. Everything not yet sent stays
   * pending and can be continued later.
   */
  async cancelJob(jobId: string): Promise<MailSendJob> {
    const { count } = await this.prisma.mailSendJob.updateMany({
      where: {
        id: jobId,
        status: { in: [MailSendJobState.queued, MailSendJobState.running] },
      },
      data: {
        status: MailSendJobState.cancelled,
        finishedAt: new Date(),
      },
    });

    if (!count) {
      throw new BadRequestException('Only a running job can be cancelled.');
    }

    return this.prisma.mailSendJob.findUniqueOrThrow({ where: { id: jobId } });
  }

  /**
   * Process pending send jobs. Claims each `queued` job atomically (so the
   * immediate trigger and the interval never double-process), and re-queues
   * jobs whose worker went away.
   */
  async drain(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;

    try {
      await this.requeueStalledJobs();

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

  /**
   * Hand interrupted jobs back to the queue so they continue where they left
   * off. A job that keeps dying is stopped after {@link MAX_AUTO_RESUMES}
   * attempts rather than looping forever.
   */
  private async requeueStalledJobs(): Promise<void> {
    const threshold = new Date(Date.now() - STALLED_AFTER_MS);

    const stalled = await this.prisma.mailSendJob.findMany({
      where: {
        status: MailSendJobState.running,
        OR: [
          { heartbeatAt: { lt: threshold } },
          { heartbeatAt: null, startedAt: { lt: threshold } },
          { heartbeatAt: null, startedAt: null, createdAt: { lt: threshold } },
        ],
      },
      select: { id: true, resumeCount: true },
    });

    for (const job of stalled) {
      const giveUp = job.resumeCount >= MAX_AUTO_RESUMES;

      // Guarded by the status so a worker that comes back to life in the same
      // moment is not overwritten.
      await this.prisma.mailSendJob.updateMany({
        where: { id: job.id, status: MailSendJobState.running },
        data:
          giveUp ?
            {
              status: MailSendJobState.failed,
              error: ABANDONED_ERROR,
              finishedAt: new Date(),
            }
          : {
              status: MailSendJobState.queued,
              error: INTERRUPTED_ERROR,
              resumeCount: { increment: 1 },
            },
      });

      this.logger.warn(
        `Job ${job.id} stalled and was ${giveUp ? 'stopped' : 'requeued'}.`
      );
    }
  }

  /** Atomically move a queued job to running. Returns false if already taken. */
  private async claim(jobId: string): Promise<boolean> {
    const { count } = await this.prisma.mailSendJob.updateMany({
      where: { id: jobId, status: MailSendJobState.queued },
      data: {
        status: MailSendJobState.running,
        startedAt: new Date(),
        heartbeatAt: new Date(),
      },
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

    try {
      await this.buildQueue(job);
      await this.sendQueue(job, template);
    } catch (error) {
      // Whatever went wrong here is about the job, not about one recipient:
      // leave the remaining recipients pending so it can be continued.
      await this.prisma.mailSendJob.update({
        where: { id: jobId },
        data: {
          status: MailSendJobState.failed,
          error: (error as Error).message,
          finishedAt: new Date(),
        },
      });
      this.logger.error(`Job ${jobId} aborted: ${(error as Error).message}`);
      return;
    }

    await this.finish(jobId);
  }

  /**
   * Materialise the audience into one queue row per planned mail. Done once per
   * job: from here on the job works off those rows, which is what makes it
   * resumable and inspectable.
   */
  private async buildQueue(job: MailSendJob): Promise<void> {
    if (job.recipientsResolvedAt) {
      return;
    }

    // Nothing can have been sent before the queue is complete, so a partial
    // queue left behind by an interrupted build is safe to discard.
    await this.prisma.mailSendJobRecipient.deleteMany({
      where: { jobId: job.id },
    });

    const audience = job.recipientFilter as unknown as MailAudienceInput;
    let position = 0;

    for (;;) {
      const recipients = await this.recipientService.resolvePage(
        audience,
        position,
        BATCH_SIZE,
        job.channel
      );

      if (recipients.length === 0) {
        break;
      }

      await this.prisma.mailSendJobRecipient.createMany({
        data: recipients.map(({ user, subscription }, index) => ({
          jobId: job.id,
          userId: user.id,
          subscriptionId: subscription?.id ?? null,
          position: position + index,
        })),
      });

      position += recipients.length;

      await this.prisma.mailSendJob.update({
        where: { id: job.id },
        data: { heartbeatAt: new Date() },
      });
    }

    await this.prisma.mailSendJob.update({
      where: { id: job.id },
      data: {
        recipientsResolvedAt: new Date(),
        totalCount: position,
        heartbeatAt: new Date(),
      },
    });
  }

  /** Work through the pending recipients until none are left or the job stops. */
  private async sendQueue(
    job: MailSendJob,
    template: MailTemplate
  ): Promise<void> {
    const jobId = job.id;
    let processed = 0;
    let progressAt = Date.now();
    let attachmentFailuresInARow = 0;

    for (;;) {
      if (!(await this.isRunning(jobId))) {
        return;
      }

      const batch = await this.prisma.mailSendJobRecipient.findMany({
        where: { jobId, state: MailSendJobRecipientState.pending },
        orderBy: { position: 'asc' },
        take: SEND_BATCH_SIZE,
      });

      if (!batch.length) {
        return;
      }

      const recipients = await this.recipientService.loadQueued(batch);

      for (const entry of batch) {
        // Checked per mail, not per batch: cancelling has to take effect on the
        // next recipient, not 25 mails later.
        if (!(await this.isRunning(jobId))) {
          await this.writeProgress(jobId);

          return;
        }

        if (!(await this.claimRecipient(entry.id))) {
          continue;
        }

        const recipient = recipients.get(recipientKey(entry));

        if (!recipient) {
          await this.markRecipient(entry.id, MailSendJobRecipientState.failed, {
            error: 'Recipient no longer exists.',
          });
          continue;
        }

        const failure = await this.deliver(job, template, entry, recipient);

        if (!(failure instanceof MailAttachmentError)) {
          attachmentFailuresInARow = 0;
        } else if (
          ++attachmentFailuresInARow >= ATTACHMENT_FAILURES_BEFORE_STOP
        ) {
          // Caught by processJob, which fails the job and leaves the rest of
          // the queue pending.
          throw new Error(
            `Stopped after ${attachmentFailuresInARow} mails in a row whose attachments could not be rendered: ${failure.message} Continue the job, retrying the failed mails, once that is fixed.`
          );
        }

        if (
          ++processed % PROGRESS_EVERY === 0 ||
          Date.now() - progressAt >= PROGRESS_INTERVAL_MS
        ) {
          await this.writeProgress(jobId);
          progressAt = Date.now();
        }
      }

      await this.writeProgress(jobId);
    }
  }

  /**
   * Send one queued message and record the outcome on its queue row. Never
   * throws: a recipient that cannot be reached must not stop the rest of the
   * job. Returns why the message failed, if it did. Which medium is used is
   * the job's decision — everything else about a send is the same either way.
   */
  private async deliver(
    job: Pick<
      MailSendJob,
      | 'id'
      | 'channel'
      | 'addressPosition'
      | 'deliveryProduct'
      | 'printMode'
      | 'printSpectrum'
    >,
    template: MailTemplate,
    entry: Pick<MailSendJobRecipient, 'id'>,
    recipient: MailRecipient
  ): Promise<Error | null> {
    const mailLogId = uuidv7();
    const isLetter = job.channel === MailChannel.letter;

    try {
      const optionalData = await this.buildOptionalData(template, recipient);

      if (isLetter) {
        await this.letterContext.sendLetter({
          mailTemplateId: template.id,
          recipient: recipient.user,
          data: { user: recipient.user, optional: optionalData },
          print: {
            addressPosition: job.addressPosition,
            deliveryProduct: job.deliveryProduct,
            printMode: job.printMode,
            printSpectrum: job.printSpectrum,
          },
          mailSendJobId: job.id,
          mailLogId,
        });
      } else {
        await this.mailContext.sendMail({
          mailTemplateId: template.id,
          recipient: recipient.user,
          optionalData,
          mailType: mailLogType.Manual,
          mailSendJobId: job.id,
          mailLogId,
          isRetry: false,
        });
      }

      await this.markRecipient(entry.id, MailSendJobRecipientState.sent, {
        mailLogId,
        sentAt: new Date(),
        error: null,
      });

      return null;
    } catch (error) {
      const message = (error as Error).message;

      await this.markRecipient(entry.id, MailSendJobRecipientState.failed, {
        mailLogId,
        error: message,
      });

      this.logger.warn(
        `Job ${job.id}: failed to ${isLetter ? 'post to' : 'mail'} ${
          recipient.user.email
        }: ${message}`
      );

      return error as Error;
    }
  }

  /**
   * Take a recipient out of the queue before sending. Atomic, so two workers on
   * the same job can never both deliver the same mail.
   */
  private async claimRecipient(id: string): Promise<boolean> {
    const { count } = await this.prisma.mailSendJobRecipient.updateMany({
      where: { id, state: MailSendJobRecipientState.pending },
      data: {
        state: MailSendJobRecipientState.sending,
        attempts: { increment: 1 },
      },
    });

    return count === 1;
  }

  private async markRecipient(
    id: string,
    state: MailSendJobRecipientState,
    data: Partial<
      Pick<MailSendJobRecipient, 'error' | 'mailLogId' | 'sentAt'>
    > = {}
  ): Promise<void> {
    await this.prisma.mailSendJobRecipient.update({
      where: { id },
      data: { state, ...data },
    });
  }

  private async isRunning(jobId: string): Promise<boolean> {
    const job = await this.prisma.mailSendJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    return job?.status === MailSendJobState.running;
  }

  /** Counts of the queue rows, the single source of truth for a job's progress. */
  async countsFor(jobId: string): Promise<MailSendJobCounts> {
    const grouped = await this.prisma.mailSendJobRecipient.groupBy({
      by: ['state'],
      where: { jobId },
      _count: { _all: true },
    });

    const countOf = (state: MailSendJobRecipientState) =>
      grouped.find(group => group.state === state)?._count._all ?? 0;

    const sent = countOf(MailSendJobRecipientState.sent);
    const failed = countOf(MailSendJobRecipientState.failed);
    const sending = countOf(MailSendJobRecipientState.sending);
    const pending = countOf(MailSendJobRecipientState.pending);

    return {
      total: sent + failed + sending + pending,
      sent,
      failed,
      sending,
      pending,
    };
  }

  private async writeProgress(jobId: string): Promise<void> {
    const counts = await this.countsFor(jobId);

    await this.prisma.mailSendJob.update({
      where: { id: jobId },
      data: {
        sentCount: counts.sent,
        failedCount: counts.failed,
        sendingCount: counts.sending,
        heartbeatAt: new Date(),
      },
    });
  }

  /**
   * Close a job off. A job that was stopped from the outside keeps the status
   * it was given — only its counts are brought up to date, so what is left over
   * stays visible and can be continued.
   */
  private async finish(jobId: string): Promise<MailSendJob> {
    const counts = await this.countsFor(jobId);
    const job = await this.prisma.mailSendJob.findUniqueOrThrow({
      where: { id: jobId },
    });

    const stoppedFromOutside = job.status !== MailSendJobState.running;
    const unfinished = counts.pending + counts.sending;

    return this.prisma.mailSendJob.update({
      where: { id: jobId },
      data: {
        sentCount: counts.sent,
        failedCount: counts.failed,
        sendingCount: counts.sending,
        // A job from before the queue existed has no rows to count.
        totalCount: counts.total || job.totalCount,
        status:
          stoppedFromOutside ? job.status
            // Left the loop with work remaining although nobody stopped it.
          : unfinished > 0 ? MailSendJobState.failed
          : counts.failed && !counts.sent ? MailSendJobState.failed
          : MailSendJobState.done,
        finishedAt: new Date(),
        heartbeatAt: new Date(),
        error:
          !stoppedFromOutside && unfinished > 0 ? INTERRUPTED_ERROR : job.error,
      },
    });
  }

  /**
   * Render the template for one recipient of an audience, exactly as the send
   * would compose it — same recipient resolution, same optional data. Without a
   * `recipientId` the first recipient of the audience is used.
   */
  async previewForAudience(input: {
    mailTemplateId: string;
    audience: MailAudienceInput;
    recipientId?: string | null;
    channel?: MailChannel | null;
    print?: LetterPrintInput | null;
  }): Promise<{
    subject: string;
    html: string;
    text?: string;
    pdf?: string;
    /** Mail only; a letter prints them inside its pdf. */
    attachments: { filename: string; pdf: string }[];
    recipient: MailRecipient | null;
  }> {
    await this.assertChannelAllowed(input.channel);

    const template = await this.loadTemplate(input.mailTemplateId);
    const recipient = await this.findPreviewRecipient(
      input.audience,
      input.recipientId,
      input.channel
    );

    if (!recipient) {
      return { subject: '', html: '', attachments: [], recipient: null };
    }

    const optionalData = await this.buildOptionalData(template, recipient);

    if (input.channel === MailChannel.letter) {
      if (!canReceiveLetters(recipient.user)) {
        throw new BadRequestException(
          `${recipient.user.email} has no usable postal address.`
        );
      }

      const print = printSettings(input.print);
      const pdf = await this.letterContext.renderLetter({
        template: {
          htmlContent: template.htmlContent,
          letterAppendixId: template.letterAppendixId,
          attachmentIds: attachmentIdsOf(template),
        },
        layout: await this.letterContext.resolveLayout(template.letterLayoutId),
        addressPosition: print.addressPosition,
        printMode: print.printMode,
        data: { user: recipient.user, optional: optionalData },
        recipient: toLetterAddress(recipient.user),
      });

      return {
        subject: template.subject,
        html: '',
        pdf: pdf.toString('base64'),
        attachments: [],
        recipient,
      };
    }

    const data = {
      user: recipient.user,
      optional: optionalData,
      jwt: await this.mailContext.jwtGenerator(recipient.user.id),
      currentDate: new Date(),
    };
    const composed = composeMail(
      {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      },
      data
    );
    // Not caught: a document that cannot be rendered fails the send for this
    // recipient too, so the preview says why before anything goes out.
    const attachmentIds = attachmentIdsOf(template);
    const attachments =
      attachmentIds.length ?
        await this.attachments.render(attachmentIds, data)
      : [];

    return {
      subject: composed.subject,
      html: composed.messageHtml,
      text: composed.message,
      attachments: attachments.map(({ filename, content }) => ({
        filename,
        pdf: content.toString('base64'),
      })),
      recipient,
    };
  }

  /**
   * The recipient a preview is rendered for. `recipientId` is the row id the
   * editor lists (`userId:subscriptionId`), which is only resolvable by walking
   * the audience — the same order the send uses.
   */
  private async findPreviewRecipient(
    audience: MailAudienceInput,
    recipientId?: string | null,
    channel?: MailChannel | null
  ): Promise<MailRecipient | null> {
    let skip = 0;

    for (;;) {
      const page = await this.recipientService.resolvePage(
        audience,
        skip,
        BATCH_SIZE,
        channel
      );

      if (!page.length) {
        return null;
      }

      if (!recipientId) {
        return page[0];
      }

      const match = page.find(
        ({ user, subscription }) =>
          `${user.id}:${subscription?.id ?? ''}` === recipientId
      );

      if (match) {
        return match;
      }

      skip += BATCH_SIZE;
    }
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

    return findMissingPlaceholders(
      template,
      withSubscriptionData,
      await this.attachmentPlaceholders(attachmentIdsOf(template))
    );
  }

  /**
   * Only a warning: an attachment that cannot be read now fails the send
   * itself, with its own message, so the check of the template goes on.
   */
  private async attachmentPlaceholders(
    documentIds: string[]
  ): Promise<string[]> {
    if (!documentIds.length) {
      return [];
    }

    try {
      return await this.attachments.placeholders(documentIds);
    } catch (error) {
      this.logger.warn(
        `Could not read the placeholders of attachments ${documentIds.join(
          ', '
        )}: ${(error as Error).message}`
      );

      return [];
    }
  }

  private audienceFor(audience: MailAudienceInput): MailSendAudience {
    return audience.base === MailRecipientBase.allUsers ?
        MailSendAudience.allUsers
      : MailSendAudience.filteredSubscriptions;
  }

  private contextId(template: MailTemplate): MailTemplateContextId {
    return (template.context ?? 'custom') as MailTemplateContextId;
  }

  private async loadTemplate(
    id: string
  ): Promise<MailTemplate & { attachments?: { documentId: string }[] }> {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id },
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
    });

    if (!template) {
      throw new BadRequestException('Mail template not found.');
    }

    return template;
  }
}
