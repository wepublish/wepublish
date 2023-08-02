import {Injectable, OnModuleInit} from '@nestjs/common'
import {PaymentProvider} from './payment-provider/paymentProvider'
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
}
