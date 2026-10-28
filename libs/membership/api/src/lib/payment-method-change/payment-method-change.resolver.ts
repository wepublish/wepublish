import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import {
  ChangeSubscriptionPaymentMethodArgs,
  StartedSubscriptionPaymentMethodChange,
  SubscriptionPaymentMethodChange,
} from './payment-method-change.model';
import { PaymentMethodChangeService } from './payment-method-change.service';

@Resolver(() => SubscriptionPaymentMethodChange)
export class PaymentMethodChangeResolver {
  constructor(private service: PaymentMethodChangeService) {}

  @Authenticated()
  @Mutation(() => StartedSubscriptionPaymentMethodChange, {
    description: `Moves one of the authenticated user's subscriptions to another payment method. With an open invoice, the invoice is paid with the new payment method; otherwise the new payment method is authorized without a charge. The subscription keeps its current payment method until then.`,
  })
  async changeSubscriptionPaymentMethod(
    @Args() args: ChangeSubscriptionPaymentMethodArgs,
    @CurrentUser() { user }: UserSession
  ) {
    return this.service.start(user.id, args);
  }

  @Authenticated()
  @Mutation(() => SubscriptionPaymentMethodChange, {
    description: `Asks the payment provider whether the reader finished paying or authorizing, for when they return before the provider reported it.`,
  })
  async checkSubscriptionPaymentMethodChange(
    @Args('id') id: string,
    @CurrentUser() { user }: UserSession
  ) {
    return this.service.check(user.id, id);
  }

  @Authenticated()
  @Mutation(() => SubscriptionPaymentMethodChange, {
    description: `Cancels a pending payment method change; the subscription keeps its current payment method.`,
  })
  async cancelSubscriptionPaymentMethodChange(
    @Args('id') id: string,
    @CurrentUser() { user }: UserSession
  ) {
    return this.service.cancel(user.id, id);
  }
}
