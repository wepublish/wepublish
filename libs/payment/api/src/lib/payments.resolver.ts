import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { CanCreateUser } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  Payment,
  PaymentFromInvoiceInput,
  PaymentFromSubscriptionArgs,
  SetPaymentProviderCustomersArgs,
} from './payment.model';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  @Authenticated()
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

  @Authenticated()
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

  @Permissions(CanCreateUser)
  @Mutation(() => Int, {
    description: `Stores which customer of a payment provider each user is (for bexio the contact id), replacing the user's previous one of that provider; up to 500 users per call. Users that do not exist are skipped. Returns how many users were updated.`,
  })
  async setPaymentProviderCustomers(
    @Args() args: SetPaymentProviderCustomersArgs
  ) {
    return this.paymentsService.setPaymentProviderCustomers(args);
  }
}
