import {Inject, Injectable, OnModuleInit} from '@nestjs/common'
import {PaymentProvider} from './payment-provider/paymentProvider'
import {Payment, PaymentState, PrismaClient} from '@prisma/client'

export const PaymentProviders = Symbol('PaymentProvider[]')

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    readonly prisma: PrismaClient,
    @Inject(PaymentProviders) readonly paymentProviders: PaymentProvider[]
  ) {}

  onModuleInit() {
    this.installPrismaHooks()
  }

  private installPrismaHooks() {
    this.prisma.$use(async (params, next) => {
      if (params.model !== 'Payment') {
        return next(params)
      }

      if (params.action !== 'update') {
        return next(params)
      }

      const model: Payment = await next(params)

      if (model.state === PaymentState.paid) {
        const invoice = await this.prisma.invoice.findUnique({
          where: {id: model.invoiceID},
          include: {
            items: true
          }
        })

        if (!invoice) {
          console.warn(`No invoice with id ${model.invoiceID}`)
          return
        }

        const {items, ...invoiceData} = invoice

        await this.prisma.invoice.update({
          where: {id: invoice.id},
          data: {
            ...invoiceData,
            items: {
              deleteMany: {
                invoiceId: invoiceData.id
              },
              create: items.map(({invoiceId, ...item}) => item)
            },
            paidAt: new Date(),
            canceledAt: null
          }
        })
      }

      return model
    })
  }

  getProviders() {
    return this.paymentProviders
  }

  findById(id: string) {
    return this.paymentProviders.find(p => p.id === id)
  }
}
