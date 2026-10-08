import { Args, Query, Resolver } from '@nestjs/graphql';
import { SubscriptionDeactivationReason } from '@prisma/client';
import {
  CanCreateInvoice,
  CanCreateSubscription,
  CanCreateUser,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

import { ActionMail, SubscriptionCreationMailArgs } from './action-mail.model';
import { ActionMailService } from './action-mail.service';

/**
 * Lets the editor ask, before running an admin action, which mail the action
 * would send to the user, or why it sends none. Each query has the permission
 * of the mutation it belongs to.
 */
@Resolver(() => ActionMail)
export class ActionMailResolver {
  constructor(private actionMail: ActionMailService) {}

  @Permissions(CanCreateSubscription)
  @Query(() => ActionMail, {
    description: `The mail createSubscription would send for a subscription with these settings, or why it sends none.`,
  })
  subscriptionCreationMail(@Args() draft: SubscriptionCreationMailArgs) {
    return this.actionMail.forSubscriptionCreation(draft);
  }

  @Permissions(CanCreateSubscription)
  @Query(() => ActionMail, {
    description: `The mail cancelSubscription would send for this subscription and reason, or why it sends none.`,
  })
  subscriptionCancellationMail(
    @Args('id') id: string,
    @Args('reason', { type: () => SubscriptionDeactivationReason })
    reason: SubscriptionDeactivationReason
  ) {
    return this.actionMail.forSubscriptionCancellation(id, reason);
  }

  @Permissions(CanCreateUser)
  @Query(() => ActionMail, {
    description: `The mail createUser would send, or why it sends none.`,
  })
  accountCreationMail() {
    return this.actionMail.forAccountCreation();
  }

  @Permissions(CanCreateInvoice)
  @Query(() => ActionMail, {
    description: `The mail markInvoiceAsPaid would send for this invoice, or why it sends none.`,
  })
  invoicePaymentMail(@Args('invoiceId') invoiceId: string) {
    return this.actionMail.forInvoicePayment(invoiceId);
  }
}
