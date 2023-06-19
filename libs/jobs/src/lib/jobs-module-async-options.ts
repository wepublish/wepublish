import {ModuleAsyncOptions} from '@wepublish/utils'

export const JOBS_MODULE_OPTIONS = 'JOBS_MODULE_OPTIONS'

export interface JobsModuleOptions {
  databaseUrl: string
}

export type JobsModuleAsyncOptions = ModuleAsyncOptions<JobsModuleOptions>
