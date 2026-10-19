import { ModuleAsyncOptions } from '@wepublish/utils/api';
import { BaseMailProvider } from './mail-provider/base-mail-provider';
import { PurlProvider } from './mail-data';

export const MAILS_MODULE_OPTIONS = 'MAILS_MODULE_OPTIONS';

export interface MailsModuleOptions {
  mailProvider: BaseMailProvider;
  jwtGenerator: (userId: string) => Promise<string>;
  purlProvider?: PurlProvider;
}

export type MailsModuleAsyncOptions = ModuleAsyncOptions<MailsModuleOptions>;
