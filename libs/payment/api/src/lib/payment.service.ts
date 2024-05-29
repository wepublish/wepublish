import {Injectable} from '@nestjs/common'
import {PaymentProvider} from './payment-provider/payment-provider'
import {PaymentState, PrismaClient} from '@prisma/client'
import {Prisma, Payment} from '@prisma/client'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder
} from '@wepublish/utils/api'
import {GetPaymentsArgs, PaymentFromInvoiceInput, PaymentFilter, PaymentSort} from './payment.model'
import {PaymentDataloader} from './payment.dataloader'
import {PaymentProviderService} from './payment-provider.service'
import {PaymentMethodDataloader} from '@wepublish/payment-method/api'

export const createPaymentOrder = (
  field: PaymentSort,
  sortOrder: SortOrder
): Prisma.PaymentFindManyArgs['orderBy'] => {
  switch (field) {
    case PaymentSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case PaymentSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createItendFilter = (filter: Partial<PaymentFilter>): Prisma.PaymentWhereInput => {
  if (filter?.intentID) {
    return {
      intentID: filter.intentID
    }
  }

  return {}
}

export const createPaymentFilter = (filter: Partial<PaymentFilter>): Prisma.PaymentWhereInput => ({
  AND: [createItendFilter(filter)]
})

@Injectable()
export class PaymentService {
  constructor(
    readonly prisma: PrismaClient,
    readonly paymentProviders: PaymentProviderService,
    readonly paymentMethods: PaymentMethodDataloader
  ) {}

  @PrimeDataLoader(PaymentDataloader)
  async getPaymentById(id: string): Promise<Payment> {
    return this.prisma.payment.findUnique({
      where: {id}
    })
  }

  @PrimeDataLoader(PaymentDataloader)
  async getPayments(args: GetPaymentsArgs) {
    const {filter, order, sort, skip, take, cursorId} = args

    const orderBy = createPaymentOrder(sort, order)
    const where = createPaymentFilter(filter)

    const [totalCount, payments] = await Promise.all([
      this.prisma.payment.count({
        where,
        orderBy
      }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? {id: cursorId} : undefined
      })
    ])

    const nodes = payments.slice(0, take)
    const firstItem = nodes[0]
    const lastItem = nodes[nodes.length - 1]

    const hasPreviousPage = Boolean(skip)
    const hasNextPage = payments.length > nodes.length

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstItem?.id,
        endCursor: lastItem?.id
      }
    }
  }

  async createPaymentFromInvoice(data: PaymentFromInvoiceInput): Promise<Payment> {
    const {paymentMethodID, invoiceID, failureURL, successURL} = data

    const paymentMethod = await this.paymentMethods.load(paymentMethodID)
    const paymentProvider = await this.paymentProviders.findById(paymentMethod?.paymentProviderID)

    // TODO: Replace with InvoiceDataloader
    const invoice = await this.prisma.invoice.findUnique({
      where: {id: invoiceID},
      include: {items: true}
    })

    if (!invoice || !paymentProvider) {
      throw new Error('Invalid data')
    }

    const payment = await this.prisma.payment.create({
      data: {
        paymentMethodID,
        invoiceID,
        state: PaymentState.created
      }
    })

    const intent = await paymentProvider.createIntent({
      paymentID: payment.id,
      invoice,
      saveCustomer: true,
      successURL,
      failureURL
    })

    return await this.prisma.payment.update({
      where: {id: payment.id},
      data: {
        state: intent.state,
        intentID: intent.intentID,
        intentData: intent.intentData,
        intentSecret: intent.intentSecret,
        paymentData: intent.paymentData,
        paymentMethodID: payment.paymentMethodID,
        invoiceID: payment.invoiceID
      }
    })
  }

  async findPaymentProviderByPaymentMethodId(id: string): Promise<PaymentProvider | null> {
    const paymentMethod = await this.paymentMethods.load(id)
    if (null === paymentMethod) {
      return null
    }
    return this.paymentProviders.findById(paymentMethod.paymentProviderID)
  }
}
