import { Injectable, Logger } from '@nestjs/common';
import {
  LetterJob,
  LetterJobState,
  LetterLogType,
  PrismaClient,
  Prisma,
} from '@prisma/client';
import {
  canReceiveLetters,
  DuplicateLetterError,
  LetterContext,
  LetterController,
  LetterPrintSettings,
  UserWithAddress,
} from '@wepublish/letter/api';

/** How many jobs one drain takes off the queue. */
const BATCH_SIZE = 25;

/**
 * A running job that has not reported progress for this long is considered
 * interrupted and is queued again.
 */
const STALLED_AFTER_MS = 10 * 60 * 1000;

/** How often a job may be picked up again before it stops on its own. */
const MAX_ATTEMPTS = 3;

const INTERRUPTED_ERROR = 'Job was interrupted and will be tried again.';

const ABANDONED_ERROR =
  'Job was interrupted repeatedly and stopped. Continue it manually.';

export interface EnqueueLetterProps {
  mailTemplateId: string;
  print: LetterPrintSettings;
  user: UserWithAddress;
  type: LetterLogType;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  daysAwayFromEnding?: number | null;
  runDate?: Date | null;
}

export function letterIdentifierFor(props: EnqueueLetterProps): string {
  return `${props.type}-${
    props.runDate ? props.runDate.toISOString() : 'null'
  }-${props.daysAwayFromEnding}-${props.mailTemplateId}-${props.user.id}`;
}

@Injectable()
export class LetterJobService {
  private readonly logger = new Logger('LetterJobService');
  private draining = false;

  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext
  ) {}

  /**
   * Queue one letter. A recipient without a usable address is skipped with a
   * log line: there is no fallback channel and no notification.
   */
  async enqueue(props: EnqueueLetterProps): Promise<LetterJob | null> {
    if (!canReceiveLetters(props.user)) {
      this.logger.warn(
        `Skipping letter for user ${props.user.id} (template ${props.mailTemplateId}): no usable postal address`
      );

      return null;
    }

    const letterIdentifier = letterIdentifierFor(props);

    try {
      return await this.prisma.letterJob.create({
        data: {
          mailTemplate: { connect: { id: props.mailTemplateId } },
          user: { connect: { id: props.user.id } },
          ...(props.subscriptionId ?
            { subscription: { connect: { id: props.subscriptionId } } }
          : {}),
          ...(props.invoiceId ?
            { invoice: { connect: { id: props.invoiceId } } }
          : {}),
          type: props.type,
          daysAwayFromEnding: props.daysAwayFromEnding,
          runDate: props.runDate,
          letterIdentifier,
          addressPosition: props.print.addressPosition,
          deliveryProduct: props.print.deliveryProduct,
          printMode: props.print.printMode,
          printSpectrum: props.print.printSpectrum,
          qrBill: props.print.qrBill,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.log(
          `Letter ${letterIdentifier} is already queued. Skipping...`
        );

        return null;
      }

      throw error;
    }
  }

  async drain(): Promise<void> {
    if (this.draining) {
      return;
    }

    this.draining = true;

    try {
      await this.requeueStalledJobs();

      const jobs = await this.prisma.letterJob.findMany({
        where: { state: LetterJobState.queued },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const job of jobs) {
        await this.run(job);
      }
    } finally {
      this.draining = false;
    }
  }

  private async requeueStalledJobs(): Promise<void> {
    const stalledBefore = new Date(Date.now() - STALLED_AFTER_MS);

    const stalled = await this.prisma.letterJob.findMany({
      where: {
        state: LetterJobState.running,
        heartbeatAt: { lt: stalledBefore },
      },
    });

    for (const job of stalled) {
      const abandoned = job.attempts >= MAX_ATTEMPTS;

      await this.prisma.letterJob.update({
        where: { id: job.id },
        data: {
          state: abandoned ? LetterJobState.failed : LetterJobState.queued,
          error: abandoned ? ABANDONED_ERROR : INTERRUPTED_ERROR,
          finishedAt: abandoned ? new Date() : null,
        },
      });
    }
  }

  private async run(job: LetterJob): Promise<void> {
    const claimed = await this.prisma.letterJob.updateMany({
      where: { id: job.id, state: LetterJobState.queued },
      data: {
        state: LetterJobState.running,
        startedAt: new Date(),
        heartbeatAt: new Date(),
        attempts: job.attempts + 1,
      },
    });

    if (!claimed.count) {
      return;
    }

    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: job.userId },
        include: { address: true },
      });

      const invoice =
        job.invoiceId ?
          await this.prisma.invoice.findUnique({
            where: { id: job.invoiceId },
            include: { items: true },
          })
        : null;

      const subscription =
        job.subscriptionId ?
          await this.prisma.subscription.findUnique({
            where: { id: job.subscriptionId },
            include: { memberPlan: true, paymentMethod: true },
          })
        : null;

      const letterLogId = await new LetterController(
        this.prisma,
        this.letterContext,
        {
          mailTemplateId: job.mailTemplateId,
          print: {
            addressPosition: job.addressPosition,
            deliveryProduct: job.deliveryProduct,
            printMode: job.printMode,
            printSpectrum: job.printSpectrum,
            qrBill: job.qrBill,
          },
          recipient: user,
          letterType: job.type,
          optionalData: { subscription, invoice, items: invoice?.items ?? [] },
          invoice,
          daysAwayFromEnding: job.daysAwayFromEnding,
          runDate: job.runDate,
          letterIdentifier: job.letterIdentifier,
        }
      ).sendLetter();

      await this.prisma.letterJob.update({
        where: { id: job.id },
        data: {
          state: LetterJobState.done,
          finishedAt: new Date(),
          letterLogId,
          error: null,
        },
      });
    } catch (error) {
      const duplicate = error instanceof DuplicateLetterError;

      if (duplicate) {
        this.logger.warn((error as Error).message);
      } else {
        this.logger.error(
          `Letter job ${job.id} failed: ${(error as Error).message}`
        );
      }

      await this.prisma.letterJob.update({
        where: { id: job.id },
        data: {
          state: duplicate ? LetterJobState.canceled : LetterJobState.failed,
          finishedAt: new Date(),
          error: (error as Error).message,
        },
      });
    }
  }
}
