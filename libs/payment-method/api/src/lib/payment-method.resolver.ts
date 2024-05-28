import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {PaymentMethodService} from './payment-method.service'
import {
  PaymentMethod,
  PaymentMethodByIdArgs,
  UpdatePaymentMethodArgs,
  CreatePaymentMethodArgs
} from './payment-method.model'
import {Permissions} from '@wepublish/permissions/api'
import {
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetPaymentMethod,
  CanGetPaymentMethods
} from '@wepublish/permissions/api'
import {PaymentMethodDataloader} from './payment-method.dataloader'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => PaymentMethod)
export class PaymentMethodResolver {
  constructor(
    private readonly paymentMethodService: PaymentMethodService,
    private readonly paymentMethodDataloader: PaymentMethodDataloader
  ) {}

  @Query(() => PaymentMethod)
  @Permissions(CanGetPaymentMethod)
  async getPaymentMethodById(@Args() {id}: PaymentMethodByIdArgs) {
    const paymentMethod = await this.paymentMethodDataloader.load(id)
    if (null === paymentMethod) {
      throw new UserInputError('Payment method not found')
    }
    return paymentMethod
  }

  @Query(() => [PaymentMethod])
  @Permissions(CanGetPaymentMethods)
  async getPaymentMethods() {
    return this.paymentMethodService.getPaymentMethods()
  }

  @Mutation(() => PaymentMethod)
  @Permissions(CanCreatePaymentMethod)
  async createPaymentMethod(@Args() {paymentMethod}: CreatePaymentMethodArgs) {
    return this.paymentMethodService.createPaymentMethod(paymentMethod)
  }

  @Mutation(() => PaymentMethod)
  @Permissions(CanCreatePaymentMethod)
  async updatePaymentMethod(@Args() {paymentMethod}: UpdatePaymentMethodArgs) {
    return this.paymentMethodService.updatePaymentMethod(paymentMethod)
  }

  @Mutation(() => PaymentMethod)
  @Permissions(CanDeletePaymentMethod)
  async deletePaymentMethodById(@Args() {id}: PaymentMethodByIdArgs) {
    return this.paymentMethodService.deletePaymentMethodById(id)
  }
}
