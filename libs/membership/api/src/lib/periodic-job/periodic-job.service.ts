import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
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
import { MailContext, MailController, mailLogType } from '@wepublish/mail/api';
import { PaymentsService } from '@wepublish/payment/api';
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
import { SubscriptionService } from '../subscription/subscription.service';
import { PeriodicJobRunObject } from './periodic-job.type';
import { getMaxTake } from '@wepublish/utils/api';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

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
    private payments: PaymentsService
  ) {}

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
    for (const periodicJobRunObject of await this.getOutstandingRuns(
      customRunDate
    )) {
      if (periodicJobRunObject.isRetry) {
        await this.retryFailedJob(periodicJobRunObject.date);
      } else {
        await this.markJobStarted(periodicJobRunObject.date);
      }

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

    this.prismaService.$transaction(promises);
  }

  private async deactivateSubscriptionsWithUnpaidInvoices(
    periodicJobRunObject: PeriodicJobRunObject
  ): Promise<void> {
    const unpaidInvoices =
      await this.subscriptionController.findUnpaidScheduledForDeactivationInvoices(
        periodicJobRunObject.date
      );

    for (const unpaidInvoice of unpaidInvoices) {
      await this.deactivateSubscriptionByInvoice(
        periodicJobRunObject,
        unpaidInvoice
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
      await this.chargeInvoice(periodicJobRunObject, invoice);
    }
  }

  private async checkStateOfOpenInvoices() {
    const invoices = await this.subscriptionController.findAllOpenInvoices();
    for (const invoice of invoices) {
      await this.checkInvoiceState(invoice);
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
      await this.createInvoice(periodicJobRunObject, subscription);
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
      await this.sendCustomMails(periodicJobRunObject, subscriptionsWithEvent);
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

    const paymentProvider =
      await this.payments.findPaymentProviderByPaymentMethodeId(
        subscriptionToCreateInvoice.paymentMethodID
      );
    if (paymentProvider) {
      const subscription = await this.prismaService.subscription.findUnique({
        where: {
          id: subscriptionToCreateInvoice.id,
        },
        include: {
          properties: true,
        },
      });
      if (subscription) {
        await paymentProvider.createRemoteInvoice({
          subscription,
          invoice,
        });
      }
    }

    await this.sendTemplateMail(
      creationEvent,
      subscriptionToCreateInvoice.user,
      periodicJobRunObject.isRetry,
      { subscriptionToCreateInvoice, invoice },
      periodicJobRunObject.date
    );
    return true;
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

    if (mailAction.action) {
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
        include: {
          properties: true,
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
   * @param runDate The original date of the job run.
   */
  private async retryFailedJob(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.update({
      where: {
        date: runDate,
      },
      data: {
        executionTime: new Date(),
      },
    });

    this.logger.warn('Retry failed job!');
  }

  /**
   * Mark a job as started at the current date.
   * @param runDate the original date of the job run.
   */
  private async markJobStarted(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.create({
      data: {
        date: runDate,
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
    customRunDate: Date
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

    if (latestRun.finishedWithError && !latestRun.successfullyFinished) {
      this.logger.warn('Last run had errors retrying....');
      runDates.push({ isRetry: true, date: startOfDay(latestRun.date) });
    }

    return runDates.concat(this.generateDateArray(latestRun.date, today));
  }

  /**
   * Generate an array of dates between the two bounds
   * @param startDate The beginning date (inclusive)
   * @param endDate The ending date (exclusive)
   * @returns An array of Date objects
   */
  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray = [];
    const lastDate = startOfDay(endDate);
    let inputDate = startOfDay(startDate);
    while (inputDate < lastDate) {
      inputDate = addDays(inputDate, 1);
      dateArray.push({ isRetry: false, date: inputDate });
    }
    return dateArray;
  }

  /**
   * Send an email and store it in the Mail Log
   * @param action the event and template to send
   * @param user the recipient
   * @param isRetry whether this is a retried delivery
   * @param optionalData unknown
   * @param periodicJobRunDate the current date for the delivery
   */
  private async sendTemplateMail(
    action: Action,
    user: User,
    isRetry: boolean,
    optionalData: Record<string, any>,
    periodicJobRunDate: Date
  ) {
    if (action.externalMailTemplate && user) {
      await new MailController(this.prismaService, this.mailContext, {
        daysAwayFromEnding: action.daysAwayFromEnding,
        externalMailTemplateId: action.externalMailTemplate,
        recipient: user,
        isRetry,
        optionalData,
        periodicJobRunDate,
        mailType: mailLogType.SubscriptionFlow,
      }).sendMail();
    }
  }
}
