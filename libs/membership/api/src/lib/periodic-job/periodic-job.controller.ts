import {OldContextService, PrismaService} from '@wepublish/nest-modules'
import {add, addDays, differenceInDays, endOfDay, set, startOfDay, sub, subMinutes} from 'date-fns'
import {SubscriptionEventDictionary} from '../subscription-event-dictionary/subscription-event-dictionary'
import {
  Invoice,
  InvoiceItem,
  MemberPlan,
  PaymentMethod,
  PaymentProviderCustomer,
  PeriodicJob,
  Subscription,
  SubscriptionEvent,
  SubscriptionPeriod,
  User
} from '@prisma/client'
import {PeriodicJobRunObject} from './periodic-job.type'
import {Injectable, Logger} from '@nestjs/common'
import {MailController, mailLogType} from '../mail/mail.controller'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'
import {SubscriptionController} from '../subscription/subscription.controller'
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

/**
 * Controller responsible for performing periodic jobs. A new controller
 * instance must be created for every run.
 */
@Injectable()
export class PeriodicJobController {
  private subscriptionEventDictionary: SubscriptionEventDictionary
  private runningJob: PeriodicJob | undefined
  private readonly logger = new Logger('PeriodicJobController')
  private randomNumberRangeForConcurrency = FIVE_MINUTES_IN_MS
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService,
    private readonly subscriptionController: SubscriptionController
  ) {
    this.subscriptionEventDictionary = new SubscriptionEventDictionary(this.prismaService)
  }

  /**
   * Run the periodic jobs. This makes sure that no two instances of the same
   * controller run their jobs at the same time and returns if they are.
   * @returns void
   */
  public async concurrentExecute() {
    await this.sleepForRandomIntervalToEnsureConcurrency()
    if (await this.isAlreadyAJobRunning()) {
      this.logger.log('Periodic job already running on an other instance. skipping...')
      return
    }
    await this.execute()
  }

  /**
   * Runs all outstanding {@link getOutstandingRuns} runs by doing the following for each run:
   * - send custom mails
   * - create invoices
   * - charge due invoices
   * - deactivate overdue subscriptions
   * If any of the tasks fail, the entire job is marked as failed.
   */
  public async execute() {
    await this.loadEnvironment()
    for (const periodicJobRunObject of await this.getOutstandingRuns()) {
      if (periodicJobRunObject.isRetry) {
        await this.retryFailedJob(periodicJobRunObject.date)
      } else {
        await this.markJobStarted(periodicJobRunObject.date)
      }
      try {
        await this.findAndSendCustomMails(periodicJobRunObject)
        await this.findAndCreateInvoices(periodicJobRunObject)
        await this.findAndChargeDueInvoices(periodicJobRunObject)
        await this.findAndDeactivateSubscriptions(periodicJobRunObject)
      } catch (e) {
        await this.markJobFailed((e as Error).toString())
        throw e
      }
      await this.markJobSuccessful()
    }
  }

  private async loadEnvironment() {
    await this.subscriptionEventDictionary.initialize()
  }

  private async findAndDeactivateSubscriptions(
    periodicJobRunObject: PeriodicJobRunObject
  ): Promise<void> {
    const unpaidInvoices = await this.subscriptionController.getSubscriptionsToDeactivate(
      periodicJobRunObject.date
    )
    for (const unpaidInvoice of unpaidInvoices) {
      await this.deactivateSubscription(periodicJobRunObject, unpaidInvoice)
    }
  }

  private async findAndChargeDueInvoices(periodicJobRunObject: PeriodicJobRunObject) {
    const invoicesToCharge = await this.subscriptionController.getInvoicesToCharge(
      endOfDay(periodicJobRunObject.date)
    )
    for (const invoiceToCharge of invoicesToCharge) {
      await this.chargeInvoice(periodicJobRunObject, invoiceToCharge)
    }
  }

  private async findAndCreateInvoices(periodicJobRunObject: PeriodicJobRunObject) {
    const subscriptionsToCreateInvoice =
      await this.subscriptionController.getSubscriptionsForInvoiceCreation(
        periodicJobRunObject.date,
        this.subscriptionEventDictionary.getEarliestInvoiceCreationDate(periodicJobRunObject.date)
      )
    for (const subscriptionToCreateInvoice of subscriptionsToCreateInvoice) {
      await this.createInvoice(periodicJobRunObject, subscriptionToCreateInvoice)
    }
  }

  private async findAndSendCustomMails(periodicJobRunObject: PeriodicJobRunObject) {
    const subscriptionsWithEvents = await this.prismaService.subscription.findMany({
      where: {
        OR: this.subscriptionEventDictionary
          .getDatesWithCustomEvent(periodicJobRunObject.date)
          .map(date => ({
            paidUntil: {
              gte: date,
              lte: subMinutes(
                set(date, {hours: 23, minutes: 59, seconds: 59, milliseconds: 999}),
                date.getTimezoneOffset()
              )
            }
          }))
      },
      include: {
        user: true
      }
    })
    for (const subscriptionsWithEvent of subscriptionsWithEvents) {
      await this.sendCustomMails(periodicJobRunObject, subscriptionsWithEvent)
    }
  }

  private async sendCustomMails(
    periodicJobRunObject: PeriodicJobRunObject,
    subscriptionsWithEvent: Subscription & {user: User}
  ) {
    const daysAwayFromEnding = differenceInDays(
      periodicJobRunObject.date,
      startOfDay(subscriptionsWithEvent.paidUntil!)
    )
    const subscriptionDictionary = this.subscriptionEventDictionary.getActionFromStore({
      memberplanId: subscriptionsWithEvent.memberPlanID,
      paymentmethodeId: subscriptionsWithEvent.paymentMethodID,
      periodicity: subscriptionsWithEvent.paymentPeriodicity,
      autorenwal: subscriptionsWithEvent.autoRenew,
      daysAwayFromEnding
    })

    for (const event of subscriptionDictionary) {
      if (event.type === SubscriptionEvent.CUSTOM) {
        await this.sendTemplateMail(
          event,
          subscriptionsWithEvent.user,
          periodicJobRunObject.isRetry,
          subscriptionsWithEvent,
          periodicJobRunObject.date
        )
      }
    }
  }

  private async createInvoice(
    periodicJobRunObject: PeriodicJobRunObject,
    subscriptionToCreateInvoice: Subscription & {
      periods: SubscriptionPeriod[]
      user: User
      memberPlan: MemberPlan
    }
  ) {
    const eventInvoiceCreation = this.subscriptionEventDictionary.getActionFromStore({
      memberplanId: subscriptionToCreateInvoice.memberPlanID,
      paymentmethodeId: subscriptionToCreateInvoice.paymentMethodID,
      periodicity: subscriptionToCreateInvoice.paymentPeriodicity,
      autorenwal: subscriptionToCreateInvoice.autoRenew,
      events: [SubscriptionEvent.INVOICE_CREATION, SubscriptionEvent.DEACTIVATION_UNPAID]
    })
    const creationEvent = eventInvoiceCreation.find(
      e => e.type === SubscriptionEvent.INVOICE_CREATION
    )
    if (!creationEvent) {
      throw new Error('No invoice creation found!')
    }
    const deactivationEvent = eventInvoiceCreation.find(
      e => e.type === SubscriptionEvent.DEACTIVATION_UNPAID
    )
    if (!deactivationEvent) {
      throw new Error('No invoice deactivation event found!')
    }

    if (
      subscriptionToCreateInvoice.paidUntil &&
      add(startOfDay(subscriptionToCreateInvoice.paidUntil), {
        days: creationEvent.daysAwayFromEnding!
      }) > periodicJobRunObject.date
    ) {
      return false
    }

    await this.subscriptionController.createInvoice(subscriptionToCreateInvoice, deactivationEvent)

    await this.sendTemplateMail(
      creationEvent,
      subscriptionToCreateInvoice.user,
      periodicJobRunObject.isRetry,
      subscriptionToCreateInvoice,
      periodicJobRunObject.date
    )
    return true
  }

  private async chargeInvoice(
    periodicJobRunObject: PeriodicJobRunObject,
    invoiceToCharge: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod
            memberPlan: MemberPlan
            user: (User & {paymentProviderCustomers: PaymentProviderCustomer[]}) | null
          })
        | null
      items: InvoiceItem[]
      subscriptionPeriods: SubscriptionPeriod[]
    }
  ) {
    if (!invoiceToCharge.subscription) {
      throw new Error(`Invoice ${invoiceToCharge.id} has no subscription assigned!`)
    }

    const eventsRenewal = this.subscriptionEventDictionary.getActionFromStore({
      memberplanId: invoiceToCharge.subscription.memberPlanID,
      paymentmethodeId: invoiceToCharge.subscription.paymentMethodID,
      periodicity: invoiceToCharge.subscription.paymentPeriodicity,
      autorenwal: invoiceToCharge.subscription.autoRenew,
      events: [SubscriptionEvent.RENEWAL_SUCCESS, SubscriptionEvent.RENEWAL_FAILED]
    })

    const mailAction = await this.subscriptionController.chargeInvoice(
      invoiceToCharge,
      eventsRenewal
    )

    if (mailAction.action) {
      const user = Object.assign({}, invoiceToCharge.subscription.user)
      await this.sendTemplateMail(
        mailAction.action,
        user,
        periodicJobRunObject.isRetry,
        {
          errorCode: mailAction.errorCode,
          ...invoiceToCharge
        },
        periodicJobRunObject.date
      )
    }
  }

  private async deactivateSubscription(
    periodicJobRunObject: PeriodicJobRunObject,
    unpaidInvoice: Invoice & {subscription: (Subscription & {user: User}) | null}
  ) {
    if (!unpaidInvoice.subscription) {
      throw new Error(`Invoice ${unpaidInvoice.id} has no subscription assigned!`)
    }
    const eventDeactivationUnpaid = this.subscriptionEventDictionary.getActionFromStore({
      memberplanId: unpaidInvoice.subscription.memberPlanID,
      paymentmethodeId: unpaidInvoice.subscription.paymentMethodID,
      periodicity: unpaidInvoice.subscription.paymentPeriodicity,
      autorenwal: unpaidInvoice.subscription.autoRenew,
      events: [SubscriptionEvent.DEACTIVATION_UNPAID]
    })
    if (!eventDeactivationUnpaid[0]) {
      throw new Error('No subscription deactivation found!')
    }

    await this.subscriptionController.deactivateSubscription(unpaidInvoice)

    await this.sendTemplateMail(
      eventDeactivationUnpaid[0],
      unpaidInvoice.subscription.user,
      periodicJobRunObject.isRetry,
      unpaidInvoice,
      periodicJobRunObject.date
    )
  }

  /**
   * Mark a job as re-trying at the current date.
   * @param runDate The original date of the job run.
   */
  private async retryFailedJob(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.update({
      where: {
        date: runDate
      },
      data: {
        executionTime: new Date()
      }
    })
    this.logger.warn('Retry failed job!')
  }

  /**
   * Mark a job as started at the current date.
   * @param runDate the original date of the job run.
   */
  private async markJobStarted(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.create({
      data: {
        date: runDate,
        executionTime: new Date()
      }
    })
  }

  /**
   * Check if any job is already being processed.
   * @returns if there are any jobs running.
   */
  private async isAlreadyAJobRunning(): Promise<boolean> {
    const runLimit = sub(new Date(), {hours: 2})
    const runs = await this.prismaService.periodicJob.findMany({
      where: {
        executionTime: {
          gte: runLimit
        }
      }
    })
    return runs.length > 0
  }

  /**
   * Mark a job as completed in the database.
   */
  private async markJobSuccessful() {
    if (!this.runningJob) {
      throw new Error('Try to make a job as successful while none is running!')
    }
    await this.prismaService.periodicJob.update({
      where: {
        id: this.runningJob.id
      },
      data: {
        successfullyFinished: new Date(),
        tries: ++this.runningJob.tries
      }
    })
    this.runningJob = undefined
  }

  /**
   * Sleep for a random time between 0 and 300 seconds to ensure that two parallel processes
   * are not starting to process the queue at the same time.
   * @returns void
   */
  private async sleepForRandomIntervalToEnsureConcurrency() {
    const randomSleepTimeout = Math.floor(Math.random() * this.randomNumberRangeForConcurrency)
    this.logger.log(
      `To ensure concurrent execution in multi instance environment choosing random number between 0 and ${this.randomNumberRangeForConcurrency}... sleeping for  ${randomSleepTimeout}ms`
    )
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    await sleep(randomSleepTimeout)
    return randomSleepTimeout
  }

  /**
   * Mark a job as failed in the database by incrementing the `tries` count and updating the failure timestamp.
   * @param error a description of the error
   */
  private async markJobFailed(error: string) {
    if (!this.runningJob) {
      throw new Error('Try to make a job as failed while none is running!')
    }
    await this.prismaService.periodicJob.update({
      where: {
        id: this.runningJob.id
      },
      data: {
        finishedWithError: new Date(),
        tries: ++this.runningJob.tries,
        error
      }
    })
    this.runningJob = undefined
  }

  /**
   * Calculate the runs in the past that have not completed yet.
   * - If the Controller is run for the first time, this returns just todays run.
   * - If the last run had an error, it returns the run when the error happened.
   * - If there was an execution pause, it returns all runs between the last successful run and the current day.
   * @returns An array of pending runs.
   */
  private async getOutstandingRuns(): Promise<PeriodicJobRunObject[]> {
    const today = new Date()
    const runDates: PeriodicJobRunObject[] = []
    const latestRun = await this.prismaService.periodicJob.findFirst({
      orderBy: {
        date: 'desc'
      }
    })
    if (!latestRun) {
      this.logger.debug('Periodic job first run')
      return [{isRetry: false, date: startOfDay(today)}]
    }
    if (latestRun.finishedWithError && !latestRun.successfullyFinished) {
      this.logger.warn('Last run had errors retrying....')
      runDates.push({isRetry: true, date: startOfDay(latestRun.date)})
    }
    return runDates.concat(this.generateDateArray(latestRun.date, today))
  }

  /**
   * Generate an array of dates between the two bounds
   * @param startDate The beginning date (inclusive)
   * @param endDate The ending date (exclusive)
   * @returns An array of Date objects
   */
  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray = []
    const lastDate = startOfDay(endDate)
    let inputDate = startOfDay(startDate)
    while (inputDate < lastDate) {
      inputDate = addDays(inputDate, 1)
      dateArray.push({isRetry: false, date: inputDate})
    }
    return dateArray
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
      await new MailController(this.prismaService, this.oldContextService, {
        daysAwayFromEnding: action.daysAwayFromEnding,
        externalMailTemplateId: action.externalMailTemplate,
        recipient: user,
        isRetry,
        optionalData,
        periodicJobRunDate,
        mailType: mailLogType.SubscriptionFlow
      }).sendMail()
    }
  }
}
