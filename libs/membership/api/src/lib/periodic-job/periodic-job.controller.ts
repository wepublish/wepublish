import {PrismaService} from '@wepublish/api'
import {add, addDays, set, subMinutes} from 'date-fns'
import {SubscriptionEventDictionary} from '../subscription-event-dictionary/subscription-event-dictionary'
import {PeriodicJob} from '@prisma/client'
import {PeriodicJobRunObject} from './periodic-job.type'

export class PeriodicJobController {
  private subscriptionEventDictionary: SubscriptionEventDictionary
  private runningJob: PeriodicJob | undefined = undefined
  constructor(private readonly prismaService: PrismaService) {
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
        // Put code here to execute as job use periodicJobRunObject as input
        this.subscriptionEventDictionary.buildEventDateList(new Date())
        const subscriptionsWithEvents = await this.prismaService.subscription.findMany({
          where: {
            OR: this.subscriptionEventDictionary
              .getDatesWithEvent()
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
            user: true,
            paymentMethod: true,
            memberPlan: true
          }
        })
        for (const subscriptionsWithEvent of subscriptionsWithEvents) {
          console.log(subscriptionsWithEvent)
        }

        throw Error('dsadsad')
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
    console.log('Retry failed job!')
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
      throw Error('Try to make a job as running while none is running!')
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
      throw Error('Try to make a job as running while none is running!')
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
      console.log('First Run')
      return [{isRetry: false, date: this.setDateMidnight(today)}]
    }
    if (latestRun.finishedWithError && !latestRun.successfullyFinished) {
      console.log('Last run had errors retrying....')
      runDates.push({isRetry: true, date: this.setDateMidnight(new Date(latestRun.date))})
    }
    return runDates.concat(this.generateDateArray(latestRun.date, today))
  }

  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray = []
    const lastDate = this.setDateMidnight(endDate)
    let inputDate = this.setDateMidnight(startDate)
    while (inputDate < lastDate) {
      inputDate = addDays(inputDate, 1)
      dateArray.push({isRetry: false, date: inputDate})
    }
    return dateArray
  }

  private setDateMidnight(date: Date): Date {
    return subMinutes(
      set(date, {hours: 0, minutes: 0, seconds: 0, milliseconds: 0}),
      date.getTimezoneOffset()
    )
  }
}
