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
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  SubscriptionPeriod,
  User,
} from '@prisma/client';
import {
  LetterAttachment,
  MailContext,
  resolveLetterRecipient,
} from '@wepublish/mail/api';
import { InvoicePaidNotifier, PaymentsService } from '@wepublish/payment/api';
import { InvoiceDeliveryService, PaperSide } from './invoice-delivery.service';
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
  addErrorContext,
  describeError,
  getMaxTake,
} from '@wepublish/utils/api';
import {
  DistributedLocks,
  type HeldLock,
  type LockResult,
} from '@wepublish/dragonfly/api';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export const NIGHT_CLAIM_MS = 12 * 60 * 60 * 1000;

const RUN_LOCK = 'periodic-job-run';
const RUN_LOCK_TTL_MS = 2 * 60 * 1000;

/** How often a refused invoice letter is offered again before someone has to look. */
const INVOICE_LETTER_ATTEMPTS = 3;

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

  private async findRunToRetry(
    lock: HeldLock | undefined,
    unavailable: boolean
  ): Promise<RetryRun> {
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
      await this.sendCustomSubscriptionEmails(periodicJobRunObject);
      this.logger.log('Processing invoice state changes...');
      await this.checkStateOfOpenInvoices();
      this.logger.log('Processing invoice creation...');
      await this.createMissingInvoicesForActiveSubscriptions(
        periodicJobRunObject
      );
      this.logger.log('Processing invoice letters still missing...');
      await this.postMissingInvoiceLetters(periodicJobRunObject.date);
      this.logger.log('Processing expiry of payment method changes...');
      // by the clock, not the run date: a catch-up run of an earlier day must
      // not keep changes alive that have expired since
      await this.paymentMethodChanges.expirePending(new Date());
      this.logger.log('Processing charge of invoices...');
      await this.chargeUnpaidDueInvoices(periodicJobRunObject);
      this.logger.log(
        'Processing deactivation of subscriptions with unpaid invoice...'
      );
      await this.deactivateSubscriptionsWithUnpaidInvoices(
        periodicJobRunObject
      );
      this.logger.log(
        'Processing deactivation of subscriptions with which are not auto renewed...'
      );
      await this.deactivateExpiredNotAutoRenewSubscriptions(
        periodicJobRunObject
      );
      this.logger.log('Periodic job successfully finished.');
    } catch (e) {
      await this.markJobFailed(inspect(e));
      throw new Error(inspect(e));
    }

    await this.markJobSuccessful();
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

  private async checkStateOfOpenInvoices() {
    const invoices = await this.subscriptionController.findAllOpenInvoices();
    for (const invoice of invoices) {
      await this.inContext(
        `Checking the state of invoice ${invoice.id} failed`,
        () => this.checkInvoiceState(invoice)
      );
    }
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
    for (const subscription of activeSubscriptionsWithoutInvoice) {
      await this.inContext(
        `Creating the invoice for subscription ${subscription.id} failed`,
        () => this.createInvoice(periodicJobRunObject, subscription)
      );
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

    if (
      subscriptionToCreateInvoice.paidUntil &&
      add(startOfDay(subscriptionToCreateInvoice.paidUntil), {
        days: creationEvent.daysAwayFromEnding ?? undefined,
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
      creationEvent
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
   * Post the invoice letter to every reader in letter mode whose open invoice
   * has not been posted yet: the print vendor refused it (a rejected log entry
   * sits under the identifier a retried run skips), its pdf could not be
   * fetched that night, or the invoice went out by email before the reader
   * was moved to letters. Nothing else carries the invoice to them.
   */
  public async postMissingInvoiceLetters(runDate: Date) {
    const letterSender = this.mailContext.letterSender;

    if (!letterSender || !(await letterSender.isConfigured())) {
      return;
    }

    const readers = await this.prismaService.userDeliveryPreference.findMany({
      where: { channel: MailChannel.letter },
      select: { userId: true },
    });
    const userIds = new Set(readers.map(({ userId }) => userId));

    if (!userIds.size) {
      return;
    }

    const invoices = (
      await this.subscriptionController.findAllOpenInvoices()
    ).filter(invoice => userIds.has(invoice.subscription?.user?.id ?? ''));

    for (const invoice of invoices) {
      await this.inContext(
        `Posting the invoice letter for invoice ${invoice.id} failed`,
        () => this.postInvoiceLetter(runDate, invoice)
      );
    }
  }

  private async postInvoiceLetter(runDate: Date, invoice: OpenInvoice) {
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
        events: [SubscriptionEvent.INVOICE_CREATION],
      })
    ).find(action => action.type === SubscriptionEvent.INVOICE_CREATION);

    if (!creationEvent?.mailTemplateId || !creationEvent.sendAsLetter) {
      return;
    }

    const attempts = await this.prismaService.mailLog.findMany({
      where: {
        recipientID: subscription.user.id,
        mailTemplateId: creationEvent.mailTemplateId,
        channel: MailChannel.letter,
        sentDate: { gte: invoice.createdAt },
      },
      select: { state: true },
    });

    if (attempts.some(({ state }) => state !== MailLogState.rejected)) {
      return;
    }

    if (attempts.length >= INVOICE_LETTER_ATTEMPTS) {
      this.logger.error(
        `The invoice letter for invoice ${invoice.id} was refused ${attempts.length} times and is not posted again`
      );

      return;
    }

    const letterRecipient = await resolveLetterRecipient({
      prisma: this.prismaService,
      letterSender: this.mailContext.letterSender,
      recipient: subscription.user,
      asLetter: true,
      withPaymentSlip: true,
      logger: this.logger,
    });

    if (!letterRecipient) {
      return;
    }

    let letterAttachment: LetterAttachment | undefined;

    try {
      letterAttachment =
        await this.invoiceDelivery.renderRemoteInvoice(invoice);
    } catch (error) {
      // Another night, rather than a letter without the invoice; the
      // provider's outage must not take the run down either.
      this.logger.warn(
        `Invoice ${invoice.id} is not posted tonight, the payment provider could not render it: ${describeError(error)}`
      );

      return;
    }

    // Never posted and nothing to print: an invoice the editor created, or a
    // provider without invoices of its own.
    if (!attempts.length && !letterAttachment) {
      return;
    }

    await this.sendTemplateMail(
      creationEvent,
      subscription.user,
      false,
      { subscriptionToCreateInvoice: subscription, invoice },
      runDate,
      { letterRecipient, letterAttachment }
    );
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
    paper?: PaperSide
  ) {
    return this.invoiceDelivery.sendFlowMail(
      action,
      user,
      isRetry,
      optionalData,
      periodicJobRunDate,
      paper
    );
  }
}
