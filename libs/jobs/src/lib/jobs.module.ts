import {DynamicModule, Module} from '@nestjs/common'
import {JobsService} from './jobs.service'
import PgBoss from 'pg-boss'

type JobsModuleOptions = {
  databaseUrl?: string
}

@Module({
  controllers: [],
  providers: [JobsService],
  exports: []
})
export class JobsModule {
  static forRoot(options?: JobsModuleOptions): DynamicModule {
    return {
      module: JobsModule,
      providers: [
        {
          provide: JobsService.JOBS_SERVICE_PG_BOSS,
          useValue: new PgBoss(options?.databaseUrl ?? process.env['DATABASE_URL']!)
        }
      ],
      exports: [JobsService]
    }
  }
}
