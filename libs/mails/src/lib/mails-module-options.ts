import {ModuleAsyncOptions} from '@wepublish/utils'
import {BaseMailProvider} from './mail-provider'

export const MAILS_MODULE_OPTIONS = 'MAILS_MODULE_OPTIONS'

export interface MailsModuleOptions {
  defaultFromAddress: string
  defaultReplyToAddress: string
  mailProvider: BaseMailProvider
}

export type MailsModuleAsyncOptions = ModuleAsyncOptions<MailsModuleOptions>
