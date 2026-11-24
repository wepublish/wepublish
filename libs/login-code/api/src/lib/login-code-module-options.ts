import { ModuleAsyncOptions } from '@wepublish/utils/api';

export const LOGIN_CODE_MODULE_OPTIONS = 'LOGIN_CODE_MODULE_OPTIONS';

export interface LoginCodeModuleOptions {
  websiteURL: string;
}

export type LoginCodeModuleAsyncOptions =
  ModuleAsyncOptions<LoginCodeModuleOptions>;
