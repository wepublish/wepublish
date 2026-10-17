import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  Payment,
  PaymentFromInvoiceInput,
  PaymentFromSubscriptionArgs,
} from './payment.model';
import {
  CurrentUser,
  RequiresFullSession,
  UserSession,
} from '@wepublish/authentication/api';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  @RequiresFullSession()
  @Mutation(() => Payment, {
    nullable: true,
    description:
      'This mutation allows to create payment by taking an input of type PaymentFromInvoiceInput.',
  })
  async createPaymentFromInvoice(
    @Args('input') input: PaymentFromInvoiceInput,
    @CurrentUser() { user }: UserSession
  ) {
    return this.paymentsService.createPaymentFromInvoice(user.id, input);
  }

  @RequiresFullSession()
  @Mutation(() => Payment, {
    nullable: true,
    description:
      'This mutation allows to create payment by referencing a subscription.',
  })
  async createPaymentFromSubscription(
    @Args() args: PaymentFromSubscriptionArgs,
    @CurrentUser() { user }: UserSession
  ) {
    return this.paymentsService.createPaymentFromSubscription(user.id, args);
  }
}
