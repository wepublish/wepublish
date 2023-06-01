import {DynamicModule, Module} from '@nestjs/common'
import {Scheduler} from './scheduler.service'
import {PgBossService} from './pg-boss.service'
import PgBoss from 'pg-boss'

type JobsModuleOptions = {
  databaseUrl?: string
}

@Module({
  controllers: [],
  providers: [
    Scheduler,
    {
      provide: PgBoss,
      useExisting: PgBossService
    }
  ],
  exports: []
})
export class JobsModule {
  static forRoot(options?: JobsModuleOptions): DynamicModule {
    return {
      module: JobsModule,
      providers: [
        {
          provide: PgBossService,
          useValue: new PgBossService(options?.databaseUrl ?? process.env['DATABASE_URL']!)
        }
      ],
      exports: [Scheduler]
    }
  }
}
