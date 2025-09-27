import {Injectable} from '@nestjs/common'
import {CreatePaymentMethodInput, UpdatePaymentMethodInput} from './payment-method.model'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {PaymentMethodDataloader} from './payment-method.dataloader'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PaymentMethodDataloader)
  async getPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      orderBy: {createdAt: 'desc'}
    })
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async createPaymentMethod(input: CreatePaymentMethodInput) {
    return this.prisma.paymentMethod.create({
      data: input
    })
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async updatePaymentMethod({id, ...input}: UpdatePaymentMethodInput) {
    return this.prisma.paymentMethod.update({
      where: {id},
      data: input
    })
  }

  async deletePaymentMethodById(id: string) {
    return this.prisma.paymentMethod.delete({
      where: {id}
    })
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async findActivePaymentMethodById(id: string) {
    return this.prisma.paymentMethod.findFirst({
      where: {id, active: true}
    })
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async findActivePaymentMethodBySlug(slug: string) {
    return this.prisma.paymentMethod.findFirst({
      where: {slug, active: true}
    })
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async getAvailablePaymentMethodsByIds(paymentMethodIds: string[]) {
    return this.prisma.paymentMethod.findMany({
      where: {
        id: {
          in: paymentMethodIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
