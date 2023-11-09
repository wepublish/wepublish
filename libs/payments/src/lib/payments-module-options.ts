import {ModuleAsyncOptions} from '@wepublish/utils'
import {PaymentProvider} from './payment-provider'

export const PAYMENTS_MODULE_OPTIONS = 'PAYMENTS_MODULE_OPTIONS'

export interface PaymentsModuleOptions {
  paymentProviders: PaymentProvider[]
}

export type PaymentsModuleAsyncOptions = ModuleAsyncOptions<PaymentsModuleOptions>
