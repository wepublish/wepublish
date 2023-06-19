import {ModuleAsyncOptions} from '@wepublish/utils'

export const MAILS_MODULE_OPTIONS = 'MAILS_MODULE_OPTIONS'

export interface MailsModuleOptions {
  defaultFromAddress: string
  defaultReplyToAddress: string
}

export type MailsModuleAsyncOptions = ModuleAsyncOptions<MailsModuleOptions>
