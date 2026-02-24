import { ModuleAsyncOptions } from '@wepublish/utils/api';
import { BaseMailProvider } from './mail-provider/base-mail-provider';

export const MAILS_MODULE_OPTIONS = 'MAILS_MODULE_OPTIONS';

export interface MailsModuleOptions {
  mailProvider: BaseMailProvider;
}

export type MailsModuleAsyncOptions = ModuleAsyncOptions<MailsModuleOptions>;
