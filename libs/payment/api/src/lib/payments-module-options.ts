import {ModuleAsyncOptions} from '@wepublish/utils/api'
import {PaymentProvider} from './payment-provider/payment-provider'

export const PAYMENTS_MODULE_OPTIONS = 'PAYMENTS_MODULE_OPTIONS'

export interface PaymentsModuleOptions {
  paymentProviders: PaymentProvider[]
}

export type PaymentsModuleAsyncOptions = ModuleAsyncOptions<PaymentsModuleOptions>
