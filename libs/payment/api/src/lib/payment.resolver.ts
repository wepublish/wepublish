import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {PaymentService} from './payment.service'
import {Permissions} from '@wepublish/permissions/api'
import {CanCreatePayment, CanGetPayment, CanGetPayments} from '@wepublish/permissions/api'
import {
  Payment,
  PaymentsResult,
  PaymentFromInvoiceArgs,
  PaymentByIdArgs,
  GetPaymentsArgs
} from './payment.model'
import {PaymentDataloader} from './payment.dataloader'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(
    private paymentsService: PaymentService,
    private paymentDataloader: PaymentDataloader
  ) {}

  @Query(() => Payment)
  @Permissions(CanGetPayment)
  async getPaymentById(@Args() {id}: PaymentByIdArgs) {
    const payment = await this.paymentDataloader.load(id)
    if (null === payment) {
      throw new UserInputError('Payment not found')
    }
    return payment
  }

  @Query(() => PaymentsResult)
  @Permissions(CanGetPayments)
  async getPayments(@Args() args: GetPaymentsArgs) {
    return this.paymentsService.getPayments(args)
  }

  @Mutation(() => Payment)
  @Permissions(CanCreatePayment)
  async createPaymentFromInvoice(@Args() {input}: PaymentFromInvoiceArgs) {
    return this.paymentsService.createPaymentFromInvoice(input)
  }
}
