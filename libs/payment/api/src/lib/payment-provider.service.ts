import {Injectable} from '@nestjs/common'
import {PaymentProvider} from './payment-provider/payment-provider'

@Injectable()
export class PaymentProviderService {
  constructor(readonly paymentProviders: PaymentProvider[]) {}

  findById(id: string) {
    return this.paymentProviders.find(pp => pp.id === id) ?? null
  }
}
