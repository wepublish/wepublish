import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {OldContextService, PrismaService} from '@wepublish/api'
@Module({
  controllers: [],
  providers: [PeriodicJobExecutor, PrismaService, OldContextService],
  exports: [],
  imports: []
})
export class PeriodicJobModule {}
