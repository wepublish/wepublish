import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {OldContextModule, PrismaModule} from '@wepublish/nest-modules'
@Module({
  controllers: [],
  providers: [PeriodicJobExecutor],
  exports: [],
  imports: [PrismaModule, OldContextModule]
})
export class PeriodicJobModule {}
