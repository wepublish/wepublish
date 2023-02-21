import {PrismaService} from '@wepublish/api'
import {add, addDays, format} from 'date-fns'

export class PeriodicJob {
  constructor(private readonly prismaService: PrismaService) {}

  public async execute() {
    for (const date of await this.getMissingRuns()) {
      console.log('Run job for ', date)
    }
  }

  private async getMissingRuns() {
    const today = new Date()
    const latestRun = await this.prismaService.periodicJob.findFirst({
      orderBy: {
        date: 'asc'
      }
    })
    if (!latestRun) {
      console.log('First Run')
      return [this.formatDate(today)]
    }

    return this.generateDateArray(latestRun.date, today)
  }

  private generateDateArray(startDate: Date, endDate: Date) {
    const dateArray = []
    const lastDate = this.formatDate(endDate)
    let inputDate = startDate
    while (this.formatDate(inputDate) !== lastDate) {
      inputDate = addDays(inputDate, 1)
      dateArray.push(this.formatDate(inputDate))
    }
    return dateArray
  }

  private formatDate(date: Date): string {
    return format(date, 'y-MM-dd')
  }
}
