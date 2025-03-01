import {Injectable} from '@nestjs/common'
import {PaymentProvider} from './payment-provider/payment-provider'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class PaymentsService {
  constructor(readonly prisma: PrismaClient, readonly paymentProviders: PaymentProvider[]) {}

  getProviders() {
    return this.paymentProviders
  }

  findById(id: string) {
    return this.paymentProviders.find(p => p.id === id)
  }

  async findPaymentProviderByPaymentMethodeId(id: string): Promise<PaymentProvider | undefined> {
    const paymentMethode = await this.prisma.paymentMethod.findUnique({
      where: {
        id
      }
    })
    if (!paymentMethode) return undefined
    return this.paymentProviders.find(p => p.id === paymentMethode.paymentProviderID)
  }
}
