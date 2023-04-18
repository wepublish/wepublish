import {Cron} from '@nestjs/schedule'
import {Injectable} from '@nestjs/common'
import {PeriodicJobController, SubscriptionController} from '@wepublish/membership/api'
import {OldContextService, PrismaService} from '@wepublish/api'

@Injectable()
export class PeriodicJobExecutor {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService
  ) {}

  @Cron(
    process.env.PERIODIC_JOB_EXECUTION_SCHEDULE || `0 0 3 * * *`,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    {
      disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(
        process.env.PERIODIC_JOB_EXECUTION_SCHEDULE || `0 0 3 * * *`
      )
    }
  )
  async handleCron() {
    const subscriptionController = new SubscriptionController(
      this.prismaService,
      this.oldContextService
    )
    const periodicJobController = new PeriodicJobController(
      this.prismaService,
      this.oldContextService,
      subscriptionController
    )
    await periodicJobController.concurrentExecute()
  }
}
