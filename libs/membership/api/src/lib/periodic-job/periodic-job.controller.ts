import {OldContextService, PrismaService} from '@wepublish/api'
import {add, addDays, differenceInDays, endOfDay, set, sub, subMinutes} from 'date-fns'
import {SubscriptionEventDictionary} from '../subscription-event-dictionary/subscription-event-dictionary'
import {PeriodicJob, SubscriptionEvent, User} from '@prisma/client'
import {PeriodicJobRunObject} from './periodic-job.type'
import {Injectable, Logger} from '@nestjs/common'
import {SubscriptionController} from '../subscription/subscription.controller'
import {MailController, mailLogType} from '../mail/mail.controller'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'

@Injectable()
export class PeriodicJobController {
  private subscriptionEventDictionary: SubscriptionEventDictionary
  private runningJob: PeriodicJob | undefined = undefined
  private readonly logger = new Logger('PeriodicJobController')
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService,
    private readonly subscriptionController: SubscriptionController
  ) {
    this.subscriptionEventDictionary = new SubscriptionEventDictionary(this.prismaService)
  }

  public async execute() {
    await this.loadEnvironment()
    for (const periodicJobRunObject of await this.getOutstandingRuns()) {
      if (periodicJobRunObject.isRetry) {
        await this.retryFailedJob(periodicJobRunObject.date)
      } else {
        await this.markJobStarted(periodicJobRunObject.date)
      }
      try {
        //
        // Sent Custom Mails
        //
        this.subscriptionEventDictionary.buildCustomEventDateList(periodicJobRunObject.date)
        const subscriptionsWithEvents = await this.prismaService.subscription.findMany({
          where: {
            OR: this.subscriptionEventDictionary.getDatesWithCustomEvent().map(date => ({
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
            user: true,
            paymentMethod: true,
            memberPlan: true
          }
        })
        for (const subscriptionsWithEvent of subscriptionsWithEvents) {
          const daysAwayFromEnding = differenceInDays(
            periodicJobRunObject.date,
            this.getStartOfDay(subscriptionsWithEvent.paidUntil!)
          )
          const subscriptionDictionary = this.subscriptionEventDictionary.getActionFromStore({
            memberplanId: subscriptionsWithEvent.memberPlanID,
            paymentmethodeId: subscriptionsWithEvent.paymentMethodID,
            periodicity: subscriptionsWithEvent.paymentPeriodicity,
            autorenwal: subscriptionsWithEvent.autoRenew,
            daysAwayFromEnding: daysAwayFromEnding
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

        //
        // Creating invoices which need to get created
        //
        const subscriptionsToCreateInvoice =
          await this.subscriptionController.getSubscriptionsForInvoiceCreation(
            periodicJobRunObject.date,
            this.subscriptionEventDictionary.getEarliestInvoiceCreationDate(
              periodicJobRunObject.date
            )
          )
        for (const subscriptionToCreateInvoice of subscriptionsToCreateInvoice) {
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
            add(subscriptionToCreateInvoice.paidUntil, {
              days: creationEvent.daysAwayFromEnding!
            }) >= periodicJobRunObject.date
          ) {
            continue
          }

          await this.subscriptionController.createInvoice(
            subscriptionToCreateInvoice,
            deactivationEvent
          )

          await this.sendTemplateMail(
            creationEvent,
            subscriptionToCreateInvoice.user,
            periodicJobRunObject.isRetry,
            subscriptionToCreateInvoice,
            periodicJobRunObject.date
          )
        }

        //
        // Charging Invoices which are due
        //
        const subscriptionsToChargeInvoice = await this.subscriptionController.getInvoicesToCharge(
          this.getEndOfDay(periodicJobRunObject.date)
        )
        for (const subscriptionToChargeInvoice of subscriptionsToChargeInvoice) {
          if (!subscriptionToChargeInvoice.subscription) {
            throw new Error(
              `Invoice ${subscriptionToChargeInvoice.id} has no subscription assigned!`
            )
          }

          const eventsRenewal = this.subscriptionEventDictionary.getActionFromStore({
            memberplanId: subscriptionToChargeInvoice.subscription.memberPlanID,
            paymentmethodeId: subscriptionToChargeInvoice.subscription.paymentMethodID,
            periodicity: subscriptionToChargeInvoice.subscription.paymentPeriodicity,
            autorenwal: subscriptionToChargeInvoice.subscription.autoRenew,
            events: [SubscriptionEvent.RENEWAL_SUCCESS, SubscriptionEvent.RENEWAL_FAILED]
          })

          const mailAction = await this.subscriptionController.chargeInvoice(
            subscriptionToChargeInvoice,
            eventsRenewal
          )

          if (mailAction.action) {
            const {paymentProviderCustomers, ...user} =
              subscriptionToChargeInvoice.subscription.user
            await this.sendTemplateMail(
              mailAction.action,
              user,
              periodicJobRunObject.isRetry,
              {
                errorCode: mailAction.errorCode,
                ...subscriptionToChargeInvoice
              },
              periodicJobRunObject.date
            )
          }
        }

        //
        // Deactivate Subscriptions which have invoices who are overdue
        //
        const subscriptionsToDeactivateInvoice =
          await this.subscriptionController.getSubscriptionsToDeactivate(periodicJobRunObject.date)
        for (const subscriptionToDeactivateInvoice of subscriptionsToDeactivateInvoice) {
          if (!subscriptionToDeactivateInvoice.subscription) {
            throw new Error(
              `Invoice ${subscriptionToDeactivateInvoice.id} has no subscription assigned!`
            )
          }
          const eventDeactivationUnpaid = this.subscriptionEventDictionary.getActionFromStore({
            memberplanId: subscriptionToDeactivateInvoice.subscription.memberPlanID,
            paymentmethodeId: subscriptionToDeactivateInvoice.subscription.paymentMethodID,
            periodicity: subscriptionToDeactivateInvoice.subscription.paymentPeriodicity,
            autorenwal: subscriptionToDeactivateInvoice.subscription.autoRenew,
            events: [SubscriptionEvent.DEACTIVATION_UNPAID]
          })
          if (!eventDeactivationUnpaid[0]) {
            throw new Error('No subscription deactivation found!')
          }
          await this.subscriptionController.deactivateSubscription(subscriptionToDeactivateInvoice)

          await this.sendTemplateMail(
            eventDeactivationUnpaid[0],
            subscriptionToDeactivateInvoice.subscription.user,
            periodicJobRunObject.isRetry,
            subscriptionToDeactivateInvoice,
            periodicJobRunObject.date
          )
        }
      } catch (e) {
        await this.markJobFailed((e as Error).toString())
        throw e
      }
      await this.markJobSuccessful()
    }
  }

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

  private async markJobStarted(runDate: Date) {
    this.runningJob = await this.prismaService.periodicJob.create({
      data: {
        date: runDate,
        executionTime: new Date()
      }
    })
  }

  private async markJobSuccessful() {
    if (!this.runningJob) {
      throw new Error('Try to make a job as running while none is running!')
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

  private async markJobFailed(error: string) {
    if (!this.runningJob) {
      throw new Error('Try to make a job as running while none is running!')
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

  private async loadEnvironment() {
    await this.subscriptionEventDictionary.initialize()
  }

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
      return [{isRetry: false, date: this.getStartOfDay(today)}]
    }
    if (latestRun.finishedWithError && !latestRun.successfullyFinished) {
      this.logger.warn('Last run had errors retrying....')
      runDates.push({isRetry: true, date: this.getStartOfDay(new Date(latestRun.date))})
    }
    return runDates.concat(this.generateDateArray(latestRun.date, today))
  }

  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray = []
    const lastDate = this.getStartOfDay(endDate)
    let inputDate = this.getStartOfDay(startDate)
    while (inputDate < lastDate) {
      inputDate = addDays(inputDate, 1)
      dateArray.push({isRetry: false, date: inputDate})
    }
    return dateArray
  }

  private getStartOfDay(date: Date): Date {
    return subMinutes(
      set(date, {hours: 0, minutes: 0, seconds: 0, milliseconds: 0}),
      date.getTimezoneOffset()
    )
  }
  private getEndOfDay(date: Date): Date {
    return sub(endOfDay(date), {minutes: date.getTimezoneOffset()})
  }

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
        isRetry: isRetry,
        optionalData: optionalData,
        periodicJobRunDate,
        mailType: mailLogType.SubscriptionFlow
      }).sendMail()
    }
  }
}
