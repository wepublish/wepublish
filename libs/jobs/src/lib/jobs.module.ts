import {DynamicModule, Module, Provider} from '@nestjs/common'
import {Scheduler} from './scheduler.service'
import {PgBossService} from './pg-boss.service'
import PgBoss from 'pg-boss'
import {
  JOBS_MODULE_OPTIONS,
  JobsModuleAsyncOptions,
  JobsModuleOptions
} from './jobs-module-async-options'
import {createAsyncOptionsProvider} from './module-options'

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
  static registerAsync(options: JobsModuleAsyncOptions): DynamicModule {
    return {
      module: JobsModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: JobsModuleAsyncOptions): Provider[] {
    return [
      createAsyncOptionsProvider<JobsModuleOptions>(JOBS_MODULE_OPTIONS, options),
      {
        provide: PgBossService,
        useFactory: (options: JobsModuleOptions) => new PgBossService(options.databaseUrl),
        inject: [JOBS_MODULE_OPTIONS]
      }
    ]
  }
}
