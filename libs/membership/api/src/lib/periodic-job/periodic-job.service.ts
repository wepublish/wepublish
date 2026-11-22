import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
  MailChannel,
  MailLogState,
  MemberPlan,
  PaymentMethod,
  PaymentProviderCustomer,
  PeriodicJob,
  PeriodicJobStepStatus,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  SubscriptionPeriod,
  User,
} from '@prisma/client';
import {
  LetterRecipient,
  MailAttachment,
  MailContext,
  resolveLetterRecipient,
} from '@wepublish/mail/api';
import { InvoicePaidNotifier, PaymentsService } from '@wepublish/payment/api';
import {
  InvoiceDeliveryService,
  DeliverySide,
} from './invoice-delivery.service';
import { PaymentMethodChangeService } from '../payment-method-change/payment-method-change.service';
import {
  add,
  addDays,
  differenceInDays,
  endOfDay,
  set,
  startOfDay,
  sub,
  subMinutes,
} from 'date-fns';
import { inspect } from 'util';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';
import { SubscriptionService } from './subscription.service';
import { PeriodicJobRunObject } from './periodic-job.type';
import {
  earliestInvoiceDay,
  addErrorContext,
  describeError,
  getMaxTake,
} from '@wepublish/utils/api';
import {
  DistributedLocks,
  type HeldLock,
  type LockResult,
} from '@wepublish/dragonfly/api';
import { isLegacySubscription } from '../subscription/legacy-subscription';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export const NIGHT_CLAIM_MS = 12 * 60 * 60 * 1000;

const RUN_LOCK = 'periodic-job-run';
const RUN_LOCK_TTL_MS = 2 * 60 * 1000;

/** How many invoices the run creates between two memory log lines. */
const MEMORY_LOG_EVERY = 100;

/** How often a refused invoice letter is offered again before someone has to look. */
const INVOICE_DELIVERY_ATTEMPTS = 3;

type OpenInvoice = Awaited<
  ReturnType<SubscriptionService['findAllOpenInvoices']>
>[number];

const heldLock = (acquired: LockResult) =>
  acquired.status === 'acquired' ? acquired.lock : undefined;

const toDbDate = (day: Date) =>
  new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));

const fromDbDate = (date: Date) =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

type RunState = Partial<
  Pick<
    PeriodicJob,
    'executionTime' | 'successfullyFinished' | 'finishedWithError'
  >
>;

const isUnfinished = ({
  executionTime,
  successfullyFinished,
  finishedWithError,
}: RunState) =>
  !!executionTime &&
  !successfullyFinished &&
  (!finishedWithError || executionTime > finishedWithError);

export const isPeriodicJobRunning = (job: RunState, now = Date.now()) =>
  isUnfinished(job) &&
  (job.executionTime?.getTime() ?? 0) > now - NIGHT_CLAIM_MS;

type RetryRun = Extract<PeriodicJobRunObject, { isRetry: true }>;

/** The job's own steps, in the order a run takes them. */
export const CORE_STEP_KEYS = [
  'customMails',
  'invoiceStates',
  'invoiceCreation',
  'invoiceLetters',
  'paymentMethodChanges',
  'charging',
  'deactivationUnpaid',
  'deactivationNotRenewed',
] as const;

type CoreStepKey = (typeof CORE_STEP_KEYS)[number];

/** What one step of the night did, for the job log. */
export interface NightStepRecord {
  key: string;
  status: PeriodicJobStepStatus;
  /** Counts by name, e.g. `{readers: 1821, failed: 7}`. */
  counts?: Record<string, number>;
  error?: string;
  startedAt: Date;
  finishedAt: Date;
}

/**
 * Controller responsible for performing periodic jobs. A new controller
 * instance must be created for every run.
 */
@Injectable()
export class PeriodicJobService {
  private subscriptionEventDictionary = new SubscriptionEventDictionary(
    this.prismaService
  );
  private runningJob?: PeriodicJob;
  private logger = new Logger('PeriodicJobService');
  private randomNumberRangeForConcurrency = FIVE_MINUTES_IN_MS;

  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext,
    private subscriptionController: SubscriptionService,
    private payments: PaymentsService,
    private invoicePaidNotifier: InvoicePaidNotifier,
    private locks: DistributedLocks,
    private paymentMethodChanges: PaymentMethodChangeService,
    private invoiceDelivery: InvoiceDeliveryService
  ) {}

  async isRunning(job: RunState) {
    if (!isUnfinished(job)) {
      return false;
    }

    const locked = await this.locks.isLocked(RUN_LOCK);

    return typeof locked === 'boolean' ? locked : isPeriodicJobRunning(job);
  }

  getJobLog(take: number, skip?: number) {
    return this.prismaService.periodicJob.findMany({
      skip,
      take: getMaxTake(take),
      orderBy: {
        date: 'desc',
      },
      include: { steps: { orderBy: { startedAt: 'asc' } } },
    });
  }

  getSteps(periodicJobId: string) {
    return this.prismaService.periodicJobStep.findMany({
      where: { periodicJobId },
      orderBy: { startedAt: 'asc' },
    });
  }

  /**
   * Run the periodic jobs. This makes sure that no two instances of the same
   * controller run their jobs at the same time and returns if they are.
   * @returns void
   */
  public async concurrentExecute(): Promise<void> {
    await this.sleepForRandomIntervalToEnsureConcurrency();

    if (await this.isAlreadyAJobRunning()) {
      this.logger.log(
        'Periodic job already running on an other instance. skipping...'
      );
      return;
    }

    await this.execute();
  }

  /**
   * Runs all outstanding {@link getOutstandingRuns} runs by doing the following for each run:
   * - send custom mails
   * - create invoices
   * - charge due invoices
   * - deactivate overdue subscriptions
   * If any of the tasks fail, the entire job is marked as failed.
   */
  public async execute(customRunDate: Date = new Date()) {
    const acquired = await this.locks.acquire(RUN_LOCK, RUN_LOCK_TTL_MS);

    if (acquired.status === 'taken') {
      this.logger.log(
        'Periodic job is already running on another replica, skipping'
      );
      return;
    }

    const lock = heldLock(acquired);

    try {
      await this.runOutstanding(customRunDate, lock);
    } finally {
      await lock?.release();
    }
  }

  public async retryAndCatchUp(): Promise<PeriodicJob> {
    const acquired = await this.locks.acquire(RUN_LOCK, RUN_LOCK_TTL_MS);

    if (acquired.status === 'taken') {
      throw new ConflictException(
        'A periodic job is already running. Wait until it has finished.'
      );
    }

    const lock = heldLock(acquired);

    let failedRun: RetryRun;
    let job: PeriodicJob;

    try {
      failedRun = await this.findRunToRetry(
        lock,
        acquired.status === 'unavailable'
      );
      job = await this.retryFailedJob(failedRun);
    } catch (error) {
      await lock?.release();
      throw error;
    }

    this.processRun(failedRun)
      .then(() => this.runOutstanding(new Date(), lock))
      .catch(error =>
        this.logger.error('Retrying the periodic job failed:', error)
      )
      .finally(() => lock?.release());

    return job;
  }

  /**
   * Runs today's job again now, also when it already ran tonight: load tests
   * create due subscriptions and then need the nightly run. Answers once the
   * run is taken over; it goes on in the background.
   */
  public async runTodayNow(): Promise<PeriodicJob> {
    const acquired = await this.locks.acquire(RUN_LOCK, RUN_LOCK_TTL_MS);

    if (acquired.status === 'taken') {
      throw new ConflictException(
        'A periodic job is already running. Wait until it has finished.'
      );
    }

    const lock = heldLock(acquired);
    // As a retry, so the mails already sent today are skipped.
    const run: PeriodicJobRunObject = {
      isRetry: true,
      date: startOfDay(new Date()),
      lastStartedAt: null,
    };
    let job: PeriodicJob;

    try {
      await this.refuseWhileARunGoesOn(lock, acquired.status === 'unavailable');
      job = await this.reopenRun(run.date);
    } catch (error) {
      await lock?.release();
      throw error;
    }

    this.processRun(run)
      .catch(error =>
        this.logger.error("Running today's periodic job again failed:", error)
      )
      .finally(() => lock?.release());

    return job;
  }

  private async reopenRun(runDate: Date) {
    const now = new Date();

    this.runningJob = await this.prismaService.periodicJob.upsert({
      where: { date: toDbDate(runDate) },
      create: { date: toDbDate(runDate), executionTime: now },
      update: {
        executionTime: now,
        successfullyFinished: null,
        finishedWithError: null,
        error: null,
      },
    });

    return this.runningJob;
  }

  /** Without Dragonfly, the job log is all that tells a run is going on. */
  private async refuseWhileARunGoesOn(
    lock: HeldLock | undefined,
    unavailable: boolean
  ) {
    if (!lock) {
      if (unavailable) {
        throw new ServiceUnavailableException(
          'Dragonfly is unreachable, so nothing makes sure only one replica runs the periodic job. Try again in a moment.'
        );
      }

      const latestRun = await this.prismaService.periodicJob.findFirst({
        orderBy: { date: 'desc' },
      });

      if (latestRun && isPeriodicJobRunning(latestRun)) {
        throw new ConflictException(
          'A periodic job is already running. Wait until it has finished.'
        );
      }
    }
  }

  private async findRunToRetry(
    lock: HeldLock | undefined,
    unavailable: boolean
  ): Promise<RetryRun> {
    await this.refuseWhileARunGoesOn(lock, unavailable);

    const [failedRun] = await this.getOutstandingRuns(new Date(), !!lock);

    if (!failedRun?.isRetry) {
      throw new BadRequestException(
        'There is no failed periodic job to retry.'
      );
    }

    return failedRun;
  }

  private async runOutstanding(runDate: Date, lock: HeldLock | undefined) {
    for (const periodicJobRunObject of await this.getOutstandingRuns(
      runDate,
      !!lock
    )) {
      if (lock?.lost) {
        throw new Error(
          'Lost the periodic job lock to another replica, stopping before the next run'
        );
      }

      await this.startRun(periodicJobRunObject);
      await this.processRun(periodicJobRunObject);
    }
  }

  private async startRun(periodicJobRunObject: PeriodicJobRunObject) {
    if (periodicJobRunObject.isRetry) {
      await this.retryFailedJob(periodicJobRunObject);
    } else {
      await this.markJobStarted(periodicJobRunObject.date);
    }
  }

  private async processRun(periodicJobRunObject: PeriodicJobRunObject) {
    try {
      this.logger.log('Executing periodic job...');
      this.logger.log('Processing custom mails...');
      await this.step('customMails', () =>
        this.sendCustomSubscriptionEmails(periodicJobRunObject)
      );
      this.logger.log('Processing invoice state changes...');
      await this.step('invoiceStates', () => this.checkStateOfOpenInvoices());
      this.logger.log('Processing invoice creation...');
      await this.step('invoiceCreation', () =>
        this.createMissingInvoicesForActiveSubscriptions(periodicJobRunObject)
      );
      this.logger.log('Processing invoice deliveries still missing...');
      await this.step('invoiceLetters', () =>
        this.postMissingInvoiceDeliveries(periodicJobRunObject.date)
      );
      this.logger.log('Processing expiry of payment method changes...');
      // by the clock, not the run date: a catch-up run of an earlier day must
      // not keep changes alive that have expired since
      await this.step('paymentMethodChanges', () =>
        this.paymentMethodChanges.expirePending(new Date())
      );
      this.logger.log('Processing charge of invoices...');
      await this.step('charging', () =>
        this.chargeUnpaidDueInvoices(periodicJobRunObject)
      );
      this.logger.log(
        'Processing deactivation of subscriptions with unpaid invoice...'
      );
      await this.step('deactivationUnpaid', () =>
        this.deactivateSubscriptionsWithUnpaidInvoices(periodicJobRunObject)
      );
      this.logger.log(
        'Processing deactivation of subscriptions with which are not auto renewed...'
      );
      await this.step('deactivationNotRenewed', () =>
        this.deactivateExpiredNotAutoRenewSubscriptions(periodicJobRunObject)
      );
      this.logger.log('Periodic job successfully finished.');
    } catch (e) {
      await this.markJobFailed(inspect(e));
      throw new Error(inspect(e));
    }

    await this.markJobSuccessful();
  }

  /** A busy night (all yearly subscriptions at once) is where memory shows. */
  private logMemory(step: string) {
    const { rss, heapUsed, external } = process.memoryUsage();
    const mib = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MiB`;

    this.logger.log(
      `${step} · rss ${mib(rss)} · heap ${mib(heapUsed)} · external ${mib(external)}`
    );
  }

  /** Runs one of the job's own steps and notes it on the running job. */
  private async step(key: CoreStepKey, run: () => Promise<unknown>) {
    const startedAt = new Date();

    try {
      await run();
    } catch (error) {
      await this.saveStep(this.runningJob?.id, {
        key,
        status: 'error',
        error: describeError(error),
        startedAt,
        finishedAt: new Date(),
      });
      throw error;
    }

    await this.saveStep(this.runningJob?.id, {
      key,
      status: 'ok',
      startedAt,
      finishedAt: new Date(),
    });
  }

  /**
   * Notes a step of the night that runs after the job (the syncs) on the
   * newest job, so the log shows the whole night in one place.
   */
  async recordNightStep(step: NightStepRecord) {
    const job = await this.prismaService.periodicJob.findFirst({
      orderBy: { date: 'desc' },
      select: { id: true },
    });

    if (!job) {
      this.logger.warn(`No periodic job to note step ${step.key} on`);
      return;
    }

    await this.saveStep(job.id, step);
  }

  /** The log is a report: failing to write it never fails the work itself. */
  private async saveStep(
    periodicJobId: string | undefined,
    { counts, error, ...step }: NightStepRecord
  ) {
    if (!periodicJobId) {
      return;
    }

    try {
      await this.prismaService.periodicJobStep.create({
        data: {
          periodicJobId,
          ...step,
          ...(counts ? { counts: counts as Prisma.InputJsonObject } : {}),
          ...(error ? { error } : {}),
        },
      });
    } catch (saveError) {
      this.logger.error(
        `Could not note step ${step.key} on the job log: ${describeError(saveError)}`
      );
    }
  }

  private async inContext<T>(context: string, run: () => Promise<T>) {
    try {
      return await run();
    } catch (error) {
      throw addErrorContext(error, context);
    }
  }

  private async deactivateExpiredNotAutoRenewSubscriptions(
    periodicJobRunObject: PeriodicJobRunObject
  ) {
    const subscriptionsToDeactivate =
      await this.subscriptionController.findActiveExpiredNotAutoRenewSubscriptions(
        periodicJobRunObject.date
      );

    const promises = subscriptionsToDeactivate.map(subscription =>
      this.prismaService.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          deactivation: {
            create: {
              date: subscription.paidUntil ?? subscription.startsAt,
              reason: SubscriptionDeactivationReason.userSelfDeactivated,
            },
          },
          invoices: {
            updateMany: {
              where: {
                canceledAt: null,
                paidAt: null,
              },
              data: {
                canceledAt: new Date(),
              },
            },
          },
        },
      })
    );

    await this.prismaService.$transaction(promises);
  }

  private async deactivateSubscriptionsWithUnpaidInvoices(
    periodicJobRunObject: PeriodicJobRunObject
  ): Promise<void> {
    const unpaidInvoices =
      await this.subscriptionController.findUnpaidScheduledForDeactivationInvoices(
        periodicJobRunObject.date
      );

    for (const unpaidInvoice of unpaidInvoices) {
      await this.inContext(
        `Deactivating subscription ${unpaidInvoice.subscription?.id ?? unpaidInvoice.subscriptionID} for unpaid invoice ${unpaidInvoice.id} failed`,
        () =>
          this.deactivateSubscriptionByInvoice(
            periodicJobRunObject,
            unpaidInvoice
          )
      );
    }
  }

  private async chargeUnpaidDueInvoices(
    periodicJobRunObject: PeriodicJobRunObject
  ) {
    const invoices = await this.subscriptionController.findUnpaidDueInvoices(
      endOfDay(periodicJobRunObject.date)
    );
    for (const invoice of invoices) {
      await this.inContext(`Charging invoice ${invoice.id} failed`, () =>
        this.chargeInvoice(periodicJobRunObject, invoice)
      );
    }
  }

  public async checkStateOfOpenInvoices() {
    const invoices = await this.subscriptionController.findAllOpenInvoices();
    for (const invoice of invoices) {
      await this.inContext(
        `Checking the state of invoice ${invoice.id} failed`,
        () => this.checkInvoiceState(invoice)
      );
    }
  }

  /**
   * Runs the invoice creation and charging steps of the daily periodic job
   * for the current date, without touching the periodic job run log. Intended
   * for manually triggered testing; deactivation and custom mail steps are
   * deliberately skipped.
   */
  public async forceCreateAndChargeInvoices() {
    const periodicJobRunObject: PeriodicJobRunObject = {
      isRetry: false,
      date: startOfDay(new Date()),
    };

    this.logger.log('Force run: processing invoice creation...');
    await this.createMissingInvoicesForActiveSubscriptions(
      periodicJobRunObject
    );
    this.logger.log('Force run: processing charge of invoices...');
    await this.chargeUnpaidDueInvoices(periodicJobRunObject);
    this.logger.log('Force run finished.');
  }

  private async createMissingInvoicesForActiveSubscriptions(
    periodicJobRunObject: PeriodicJobRunObject
  ) {
    const activeSubscriptionsWithoutInvoice =
      await this.subscriptionController.getActiveSubscriptionsWithoutInvoice(
        periodicJobRunObject.date,
        await this.subscriptionEventDictionary.getEarliestInvoiceCreationDate(
          periodicJobRunObject.date
        )
      );
    const total = activeSubscriptionsWithoutInvoice.length;
    this.logMemory(`Creating ${total} invoices`);

    for (const [
      index,
      subscription,
    ] of activeSubscriptionsWithoutInvoice.entries()) {
      await this.inContext(
        `Creating the invoice for subscription ${subscription.id} failed`,
        () => this.createInvoice(periodicJobRunObject, subscription)
      );

      if ((index + 1) % MEMORY_LOG_EVERY === 0 || index + 1 === total) {
        this.logMemory(`Created ${index + 1} of ${total} invoices`);
      }
    }
  }

  private async sendCustomSubscriptionEmails(
    periodicJobRunObject: PeriodicJobRunObject
  ) {
    const subscriptionsWithEvents =
      await this.prismaService.subscription.findMany({
        where: {
          OR: (
            await this.subscriptionEventDictionary.getDatesWithCustomEvent(
              periodicJobRunObject.date
            )
          ).map(date => ({
            paidUntil: {
              gte: date,
              lte: subMinutes(
                set(date, {
                  hours: 23,
                  minutes: 59,
                  seconds: 59,
                  milliseconds: 999,
                }),
                date.getTimezoneOffset()
              ),
            },
          })),
          // Don't send custom mails for deactivated subscriptions
          deactivation: {
            is: null,
          },
        },
        include: {
          user: true,
          deactivation: true,
        },
      });
    for (const subscriptionsWithEvent of subscriptionsWithEvents) {
      await this.inContext(
        `Sending custom mails for subscription ${subscriptionsWithEvent.id} failed`,
        () => this.sendCustomMails(periodicJobRunObject, subscriptionsWithEvent)
      );
    }
  }

  private async sendCustomMails(
    periodicJobRunObject: PeriodicJobRunObject,
    subscriptionsWithEvent: Subscription & { user: User }
  ) {
    const daysAwayFromEnding = differenceInDays(
      periodicJobRunObject.date,
      startOfDay(subscriptionsWithEvent.paidUntil!)
    );

    const subscriptionDictionary =
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: subscriptionsWithEvent.memberPlanID,
        paymentMethodId: subscriptionsWithEvent.paymentMethodID,
        periodicity: subscriptionsWithEvent.paymentPeriodicity,
        autorenwal: subscriptionsWithEvent.autoRenew,
        legacy: isLegacySubscription(subscriptionsWithEvent),
        daysAwayFromEnding,
      });

    const invoices = await this.prismaService.invoice.findMany({
      where: { subscriptionID: subscriptionsWithEvent.id },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    for (const event of subscriptionDictionary) {
      if (event.type === SubscriptionEvent.CUSTOM) {
        await this.sendTemplateMail(
          event,
          subscriptionsWithEvent.user,
          periodicJobRunObject.isRetry,
          { subscription: subscriptionsWithEvent, invoices },
          periodicJobRunObject.date
        );
      }
    }
  }

  private async createInvoice(
    periodicJobRunObject: PeriodicJobRunObject,
    subscriptionToCreateInvoice: Subscription & {
      periods: SubscriptionPeriod[];
      user: User;
      memberPlan: MemberPlan;
    }
  ) {
    const eventInvoiceCreation =
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: subscriptionToCreateInvoice.memberPlanID,
        paymentMethodId: subscriptionToCreateInvoice.paymentMethodID,
        periodicity: subscriptionToCreateInvoice.paymentPeriodicity,
        autorenwal: subscriptionToCreateInvoice.autoRenew,
        legacy: isLegacySubscription(subscriptionToCreateInvoice),
        events: [
          SubscriptionEvent.INVOICE_CREATION,
          SubscriptionEvent.DEACTIVATION_UNPAID,
        ],
      });

    const creationEvent = eventInvoiceCreation.find(
      e => e.type === SubscriptionEvent.INVOICE_CREATION
    );

    if (!creationEvent) {
      throw new NotFoundException('No invoice creation found!');
    }

    const deactivationEvent = eventInvoiceCreation.find(
      e => e.type === SubscriptionEvent.DEACTIVATION_UNPAID
    );

    if (!deactivationEvent) {
      throw new NotFoundException('No invoice deactivation event found!');
    }

    // A flow may create invoices earlier than this subscription's period is
    // long: the invoice then waits for the earliest day its periodicity allows.
    const creationDay =
      creationEvent.daysAwayFromEnding === null ?
        undefined
      : Math.max(
          creationEvent.daysAwayFromEnding,
          earliestInvoiceDay([subscriptionToCreateInvoice.paymentPeriodicity])
        );

    if (
      subscriptionToCreateInvoice.paidUntil &&
      add(startOfDay(subscriptionToCreateInvoice.paidUntil), {
        days: creationDay,
      }) > periodicJobRunObject.date
    ) {
      return false;
    }

    const deactivationDate = add(
      subscriptionToCreateInvoice.paidUntil || new Date(),
      {
        days: deactivationEvent.daysAwayFromEnding || undefined,
      }
    );

    const invoice = await this.subscriptionController.createInvoice(
      subscriptionToCreateInvoice,
      deactivationDate
    );

    const outcome = await this.invoiceDelivery.createRemoteInvoice(
      subscriptionToCreateInvoice,
      invoice,
      creationEvent,
      periodicJobRunObject.date
    );

    if ('skip' in outcome) {
      return outcome.skip !== 'removed';
    }

    await this.sendTemplateMail(
      creationEvent,
      subscriptionToCreateInvoice.user,
      periodicJobRunObject.isRetry,
      { subscriptionToCreateInvoice, invoice },
      periodicJobRunObject.date,
      outcome.send
    );
    return true;
  }

  /**
   * Deliver every open invoice whose invoice-creation mail or letter is still
   * owed. A reader in letter mode gets the letter posted when the print vendor
   * refused it (a rejected log entry sits under the identifier a retried run
   * skips), its pdf could not be fetched that night, or the invoice went out
   * by email before the reader was moved to letters. Any other reader gets the
   * mail with the pdf when the invoice's provider leaves delivery to
   * we.publish and the mail was held back for a missing pdf (a deferred log
   * entry) or refused. Nothing else carries the invoice to them.
   */
  public async postMissingInvoiceDeliveries(runDate: Date) {
    const letterSender = this.mailContext.letterSender;
    const letterReaders = new Set<string>();

    if (letterSender && (await letterSender.isConfigured())) {
      const readers = await this.prismaService.userDeliveryPreference.findMany({
        where: { channel: MailChannel.letter },
        select: { userId: true },
      });

      readers.forEach(({ userId }) => letterReaders.add(userId));
    }

    const mailsOwed =
      await this.invoiceDelivery.anyProviderLeavesDeliveryToUs();

    if (!letterReaders.size && !mailsOwed) {
      return;
    }

    const invoices = (
      await this.subscriptionController.findAllOpenInvoices()
    ).filter(
      invoice =>
        mailsOwed || letterReaders.has(invoice.subscription?.user?.id ?? '')
    );

    for (const invoice of invoices) {
      await this.inContext(
        `Delivering the missing invoice ${invoice.id} failed`,
        () =>
          this.deliverMissingInvoice(
            runDate,
            invoice,
            letterReaders.has(invoice.subscription?.user?.id ?? ''),
            mailsOwed
          )
      );
    }
  }

  private async deliverMissingInvoice(
    runDate: Date,
    invoice: OpenInvoice,
    inLetterMode: boolean,
    mailsOwed: boolean
  ) {
    const subscription = invoice.subscription;

    if (!subscription?.user) {
      return;
    }

    const creationEvent = (
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: subscription.memberPlanID,
        paymentMethodId: subscription.paymentMethodID,
        periodicity: subscription.paymentPeriodicity,
        autorenwal: subscription.autoRenew,
        legacy: isLegacySubscription(subscription),
        events: [SubscriptionEvent.INVOICE_CREATION],
      })
    ).find(action => action.type === SubscriptionEvent.INVOICE_CREATION);

    if (!creationEvent?.mailTemplateId) {
      return;
    }

    const letterRecipient =
      inLetterMode && creationEvent.sendAsLetter ?
        await resolveLetterRecipient({
          prisma: this.prismaService,
          letterSender: this.mailContext.letterSender,
          recipient: subscription.user,
          mailTemplateId: creationEvent.mailTemplateId,
          asLetter: true,
          withPaymentSlip: true,
          logger: this.logger,
        })
      : null;

    if (letterRecipient) {
      return this.postInvoiceLetter(
        runDate,
        invoice,
        creationEvent,
        letterRecipient
      );
    }

    if (mailsOwed) {
      return this.mailOwedInvoice(runDate, invoice, creationEvent);
    }
  }

  private async postInvoiceLetter(
    runDate: Date,
    invoice: OpenInvoice,
    creationEvent: Action,
    letterRecipient: LetterRecipient
  ) {
    const user = invoice.subscription!.user!;
    const attempts = await this.prismaService.mailLog.findMany({
      where: {
        recipientID: user.id,
        mailTemplateId: creationEvent.mailTemplateId!,
        channel: MailChannel.letter,
        sentDate: { gte: invoice.createdAt },
      },
      select: { state: true },
    });

    if (attempts.some(({ state }) => state !== MailLogState.rejected)) {
      return;
    }

    if (attempts.length >= INVOICE_DELIVERY_ATTEMPTS) {
      this.logger.error(
        `The invoice letter for invoice ${invoice.id} was refused ${attempts.length} times and is not posted again`
      );

      return;
    }

    const attachment = await this.renderOwedInvoice(invoice);

    if (attachment === null) {
      return;
    }

    // Never posted and nothing to print: an invoice the editor created, or a
    // provider without invoices of its own.
    if (!attempts.length && !attachment) {
      return;
    }

    await this.sendTemplateMail(
      creationEvent,
      user,
      false,
      { subscriptionToCreateInvoice: invoice.subscription, invoice },
      runDate,
      { letterRecipient, attachment }
    );
  }

  /**
   * The invoice-creation mail with the pdf, for an invoice whose provider
   * leaves delivery to we.publish. Owed only when it was held back for a
   * missing pdf or refused, and nothing got through on either channel since —
   * a checkout's invoice, which the provider emailed, has no entry at all.
   */
  private async mailOwedInvoice(
    runDate: Date,
    invoice: OpenInvoice,
    creationEvent: Action
  ) {
    if (!(await this.invoiceDelivery.leavesDeliveryToUs(invoice))) {
      return;
    }

    const user = invoice.subscription!.user!;
    const attempts = await this.prismaService.mailLog.findMany({
      where: {
        recipientID: user.id,
        mailTemplateId: creationEvent.mailTemplateId!,
        sentDate: { gte: invoice.createdAt },
      },
      select: { state: true },
    });

    const owed = attempts.filter(
      ({ state }) =>
        state === MailLogState.deferred || state === MailLogState.rejected
    );

    if (!attempts.length || owed.length < attempts.length) {
      return;
    }

    const refusals = owed.filter(
      ({ state }) => state === MailLogState.rejected
    ).length;

    if (refusals >= INVOICE_DELIVERY_ATTEMPTS) {
      this.logger.error(
        `The invoice mail for invoice ${invoice.id} was refused ${refusals} times and is not sent again`
      );

      return;
    }

    const attachment = await this.renderOwedInvoice(invoice);

    if (!attachment) {
      return;
    }

    await this.sendTemplateMail(
      creationEvent,
      user,
      false,
      { subscriptionToCreateInvoice: invoice.subscription, invoice },
      runDate,
      { letterRecipient: null, attachment }
    );
  }

  /**
   * The provider's pdf of an owed invoice; `null` when the provider cannot
   * render it tonight — another night rather than a delivery without the
   * invoice, and the provider's outage must not take the run down either.
   */
  private async renderOwedInvoice(
    invoice: OpenInvoice
  ): Promise<MailAttachment | undefined | null> {
    try {
      return await this.invoiceDelivery.renderRemoteInvoice(invoice);
    } catch (error) {
      this.logger.warn(
        `Invoice ${invoice.id} is not delivered tonight, the payment provider could not render it: ${describeError(error)}`
      );

      return null;
    }
  }

  private async chargeInvoice(
    periodicJobRunObject: PeriodicJobRunObject,
    invoiceToCharge: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod;
            memberPlan: MemberPlan;
            user:
              | (User & { paymentProviderCustomers: PaymentProviderCustomer[] })
              | null;
          })
        | null;
      items: InvoiceItem[];
      subscriptionPeriods: SubscriptionPeriod[];
    }
  ) {
    if (!invoiceToCharge.subscription) {
      throw new Error(
        `Invoice ${invoiceToCharge.id} has no subscription assigned!`
      );
    }

    const eventsRenewal =
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: invoiceToCharge.subscription.memberPlanID,
        paymentMethodId: invoiceToCharge.subscription.paymentMethodID,
        periodicity: invoiceToCharge.subscription.paymentPeriodicity,
        autorenwal: invoiceToCharge.subscription.autoRenew,
        legacy: isLegacySubscription(invoiceToCharge.subscription),
        events: [
          SubscriptionEvent.RENEWAL_SUCCESS,
          SubscriptionEvent.RENEWAL_FAILED,
        ],
      });

    const mailAction = await this.subscriptionController.chargeInvoice(
      invoiceToCharge,
      eventsRenewal
    );

    if (!mailAction.action) {
      return;
    }

    if (mailAction.action.type === SubscriptionEvent.RENEWAL_SUCCESS) {
      await this.invoicePaidNotifier.notify(invoiceToCharge.id);

      return;
    }

    const user = Object.assign({}, invoiceToCharge.subscription.user);
    const { subscription, items, subscriptionPeriods, ...invoice } =
      invoiceToCharge;

    await this.sendTemplateMail(
      mailAction.action,
      user,
      periodicJobRunObject.isRetry,
      {
        errorCode: mailAction.errorCode,
        invoice,
        subscriptionPeriods,
        items,
        subscription,
      },
      periodicJobRunObject.date
    );
  }

  private async checkInvoiceState(
    invoiceToCheck: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod;
            memberPlan: MemberPlan;
            user:
              | (User & { paymentProviderCustomers: PaymentProviderCustomer[] })
              | null;
          })
        | null;
      items: InvoiceItem[];
      subscriptionPeriods: SubscriptionPeriod[];
    }
  ) {
    if (!invoiceToCheck.subscription) {
      throw new Error(
        `Invoice ${invoiceToCheck.id} has no subscription assigned!`
      );
    }

    await this.subscriptionController.checkInvoiceState(invoiceToCheck);
  }

  private async deactivateSubscriptionByInvoice(
    periodicJobRunObject: PeriodicJobRunObject,
    unpaidInvoice: Invoice & {
      subscription: (Subscription & { user: User }) | null;
    }
  ) {
    if (!unpaidInvoice.subscription) {
      throw new BadRequestException(
        `Invoice ${unpaidInvoice.id} has no subscription assigned!`
      );
    }

    const eventDeactivationUnpaid =
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: unpaidInvoice.subscription.memberPlanID,
        paymentMethodId: unpaidInvoice.subscription.paymentMethodID,
        periodicity: unpaidInvoice.subscription.paymentPeriodicity,
        autorenwal: unpaidInvoice.subscription.autoRenew,
        legacy: isLegacySubscription(unpaidInvoice.subscription),
        events: [SubscriptionEvent.DEACTIVATION_UNPAID],
      });

    if (!eventDeactivationUnpaid[0]) {
      throw new NotFoundException('No subscription deactivation found!');
    }

    const paymentProvider =
      await this.payments.findPaymentProviderByPaymentMethodeId(
        unpaidInvoice.subscription.paymentMethodID
      );

    if (paymentProvider) {
      const subscription = await this.prismaService.subscription.findUnique({
        where: {
          id: unpaidInvoice.subscription.id,
        },
      });

      if (subscription) {
        await paymentProvider.cancelRemoteSubscription({
          subscription,
        });
      }
    }

    await this.subscriptionController.deactivateSubscription(unpaidInvoice);
    const { subscription, ...invoice } = unpaidInvoice;

    await this.sendTemplateMail(
      eventDeactivationUnpaid[0],
      unpaidInvoice.subscription.user,
      periodicJobRunObject.isRetry,
      { subscription, invoice },
      periodicJobRunObject.date
    );
  }

  /**
   * Mark a job as re-trying at the current date.
   * @param run The failed run, as it was read before the retry.
   */
  private async retryFailedJob({ date, lastStartedAt }: RetryRun) {
    const [claimed] = await this.prismaService.periodicJob.updateManyAndReturn({
      where: {
        date: toDbDate(date),
        executionTime: lastStartedAt,
        successfullyFinished: null,
      },
      data: {
        executionTime: new Date(),
      },
    });

    if (!claimed) {
      throw new ConflictException(
        'The failed periodic job has just been retried by someone else.'
      );
    }

    this.runningJob = claimed;
    this.logger.warn('Retry failed job!');

    // The retry runs every step again and notes them anew.
    try {
      await this.prismaService.periodicJobStep.deleteMany({
        where: { periodicJobId: claimed.id, key: { in: [...CORE_STEP_KEYS] } },
      });
    } catch (error) {
      this.logger.error(
        `Could not clear the failed try's steps: ${describeError(error)}`
      );
    }

    return claimed;
  }

  /**
   * Mark a job as started at the current date.
   * @param runDate the original date of the job run.
   */
  private async markJobStarted(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.create({
      data: {
        date: toDbDate(runDate),
        executionTime: new Date(),
      },
    });
  }

  /**
   * Check if any job is already being processed.
   * @returns if there are any jobs running.
   */
  private async isAlreadyAJobRunning(): Promise<boolean> {
    const runLimit = sub(new Date(), { hours: 2 });
    const runs = await this.prismaService.periodicJob.findMany({
      where: {
        executionTime: {
          gte: runLimit,
        },
      },
    });

    return runs.length > 0;
  }

  /**
   * Mark a job as completed in the database.
   */
  private async markJobSuccessful() {
    if (!this.runningJob) {
      throw new Error('Try to make a job as successful while none is running!');
    }

    await this.prismaService.periodicJob.update({
      where: {
        id: this.runningJob.id,
      },
      data: {
        successfullyFinished: new Date(),
        tries: ++this.runningJob.tries,
      },
    });

    this.runningJob = undefined;
  }

  /**
   * Sleep for a random time between 0 and 300 seconds to ensure that two parallel processes
   * are not starting to process the queue at the same time.
   * @returns void
   */
  private async sleepForRandomIntervalToEnsureConcurrency() {
    const randomSleepTimeout = Math.floor(
      Math.random() * this.randomNumberRangeForConcurrency
    );
    this.logger.log(
      `To ensure concurrent execution in multi instance environment choosing random number between 0 and ${this.randomNumberRangeForConcurrency}... sleeping for  ${randomSleepTimeout}ms`
    );
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    await sleep(randomSleepTimeout);

    return randomSleepTimeout;
  }

  /**
   * Mark a job as failed in the database by incrementing the `tries` count and updating the failure timestamp.
   * @param error a description of the error
   */
  private async markJobFailed(error: string) {
    if (!this.runningJob) {
      throw new Error('Try to make a job as failed while none is running!');
    }

    await this.prismaService.periodicJob.update({
      where: {
        id: this.runningJob.id,
      },
      data: {
        finishedWithError: new Date(),
        tries: ++this.runningJob.tries,
        error,
      },
    });

    this.runningJob = undefined;
  }

  /**
   * Calculate the runs in the past that have not completed yet.
   * - If the Controller is run for the first time, this returns just todays run.
   * - If the last run had an error, it returns the run when the error happened.
   * - If there was an execution pause, it returns all runs between the last successful run and the current day.
   * @returns An array of pending runs.
   */
  private async getOutstandingRuns(
    customRunDate: Date,
    exclusive = false
  ): Promise<PeriodicJobRunObject[]> {
    const today = customRunDate || new Date();
    const runDates: PeriodicJobRunObject[] = [];
    const latestRun = await this.prismaService.periodicJob.findFirst({
      orderBy: {
        date: 'desc',
      },
    });

    if (!latestRun) {
      this.logger.debug('Periodic job first run');
      return [{ isRetry: false, date: startOfDay(today) }];
    }

    const latestRunDay = fromDbDate(latestRun.date);

    if (!exclusive && isPeriodicJobRunning(latestRun)) {
      this.logger.log('Periodic job is still running, it catches up the rest');
      return [];
    }

    if (!latestRun.successfullyFinished) {
      this.logger.warn(
        latestRun.finishedWithError ?
          'Last run had errors retrying....'
        : 'Last run was aborted before it finished retrying....'
      );
      runDates.push({
        isRetry: true,
        date: latestRunDay,
        lastStartedAt: latestRun.executionTime,
      });
    }

    return runDates.concat(this.generateDateArray(latestRunDay, today));
  }

  /**
   * Generate an array of dates between the two bounds
   * @param startDate The beginning date (inclusive)
   * @param endDate The ending date (exclusive)
   * @returns An array of Date objects
   */
  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray: PeriodicJobRunObject[] = [];
    const lastDate = startOfDay(endDate);
    let inputDate = startOfDay(startDate);
    while (inputDate < lastDate) {
      inputDate = addDays(inputDate, 1);
      dateArray.push({ isRetry: false, date: inputDate });
    }
    return dateArray;
  }

  /** A subscription-flow mail or letter, through the shared invoice delivery. */
  private sendTemplateMail(
    action: Action,
    user: User,
    isRetry: boolean,
    optionalData: Record<string, any>,
    periodicJobRunDate: Date,
    delivery?: DeliverySide
  ) {
    return this.invoiceDelivery.sendFlowMail(
      action,
      user,
      isRetry,
      optionalData,
      periodicJobRunDate,
      delivery
    );
  }
}
