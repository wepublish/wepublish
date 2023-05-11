import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {OldContextModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
@Module({
  controllers: [],
  providers: [PeriodicJobExecutor, PrismaService],
  exports: [],
  imports: [PrismaModule, OldContextModule]
})
export class PeriodicJobModule {}
