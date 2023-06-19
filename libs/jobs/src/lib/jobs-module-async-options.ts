import {ModuleAsyncOptions} from './module-options'

export const JOBS_MODULE_OPTIONS = 'JOBS_MODULE_OPTIONS'

export interface JobsModuleOptions {
  databaseUrl: string
}

export type JobsModuleAsyncOptions = ModuleAsyncOptions<JobsModuleOptions>
