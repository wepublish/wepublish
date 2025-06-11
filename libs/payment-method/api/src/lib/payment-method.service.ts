import {Injectable} from '@nestjs/common'
import {CreatePaymentMethodInput, UpdatePaymentMethodInput} from './payment-method.model'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {PaymentMethodDataloader} from './payment-method.dataloader'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class PaymentMethodService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentMethodDataloader: PaymentMethodDataloader
  ) {}

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

  async findActivePaymentMethodById(id: string) {
    const paymentMethod = await this.paymentMethodDataloader.load(id)
    if (!paymentMethod?.active) {
      return null
    }
    return paymentMethod
  }

  async findActivePaymentMethodBySlug(slug: string) {
    return this.prisma.paymentMethod.findFirst({
      where: {slug, active: true}
    })
  }

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
