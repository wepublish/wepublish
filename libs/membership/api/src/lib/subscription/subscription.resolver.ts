import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
  Query,
} from '@nestjs/graphql';
import { add } from 'date-fns';
import {
  CancelPublicSubscriptionInput,
  CreatePublicSubscriptionInput,
  ImportPublicSubscriptionInput,
  PublicSubscription,
  PublicSubscriptionConnection,
  UpdateSubscriptionPaymentMethodArgs,
  SubscriptionDeactivation,
  SubscriptionListArgs,
  SubscriptionPeriod,
  SubscriptionsCSVArgs,
  UpdatePublicSubscriptionInput,
} from './subscription.model';
import { PrismaClient, Subscription } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import { MemberPlan, MemberPlanDataloader } from '@wepublish/member-plan/api';
import { PaymentMethod, PaymentMethodDataloader } from '@wepublish/payment/api';
import { SubscriptionDeactivationDataloader } from './subscription-deactivation.dataloader';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Subscription as PSubscription } from '@prisma/client';
import {
  hasPermission,
  Permissions,
  permissionsOf,
} from '@wepublish/permissions/api';
import {
  CanCreateSubscription,
  CanDeleteSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
  CanGetUsers,
} from '@wepublish/permissions';
import { isActiveSubscription } from './is-subscription-active';
import { Property } from '@wepublish/property/api';
import { SubscriptionService } from './subscription.service';
import { SubscriptionDataloader } from './subscription.dataloader';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionPeriodDataloader } from './subscription-periods.dataloader';
import { SettingDataloaderService, SettingName } from '@wepublish/settings/api';
import { PendingPaymentMethodChangeDataloader } from '../payment-method-change/pending-payment-method-change.dataloader';
import { SubscriptionPaymentMethodChange } from '../payment-method-change/payment-method-change.model';
import { PaymentMethodChangeService } from '../payment-method-change/payment-method-change.service';

/** Used when the SUBSCRIPTION_EXTEND_WINDOW_DAYS setting has no value. */
const DEFAULT_EXTEND_WINDOW_DAYS = 30;

@Resolver(() => PublicSubscription)
export class PublicSubscriptionResolver {
  constructor(
    private service: SubscriptionService,
    private dataloader: SubscriptionDataloader,
    private urlAdapter: URLAdapter,
    private prisma: PrismaClient,
    private paymentMethodDataloader: PaymentMethodDataloader,
    private deactivationDataloader: SubscriptionDeactivationDataloader,
    private periodDataloader: SubscriptionPeriodDataloader,
    private memberPlanDataloader: MemberPlanDataloader,
    private settingDataloader: SettingDataloaderService,
    private pendingPaymentMethodChangeDataloader: PendingPaymentMethodChangeDataloader,
    private paymentMethodChanges: PaymentMethodChangeService
  ) {}

  @Permissions(CanGetSubscription)
  @Query(() => PublicSubscription, {
    description: `Returns a subscription by id.`,
  })
  async subscription(@Args('id') id: string) {
    const subscription = await this.dataloader.load(id);

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} was not found.`);
    }

    return subscription;
  }

  @Permissions(CanGetSubscriptions)
  @Query(() => PublicSubscriptionConnection, {
    description: `Returns a paginated list of subscriptions based on the filters given.`,
  })
  async subscriptions(@Args() input: SubscriptionListArgs) {
    return this.service.getSubscriptions(input);
  }

  @Permissions(CanGetSubscriptions, CanGetUsers)
  @Query(() => String, {
    description: `Returns a paginated list of subscriptions based on the filters given.`,
  })
  async subscriptionsAsCsv(@Args() input: SubscriptionsCSVArgs) {
    return this.service.getSubscriptionsAsCSV(input);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Creates a new subscription.`,
  })
  public createSubscription(@Args() input: CreatePublicSubscriptionInput) {
    return this.service.createSubscription(input);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Imports a subscription.`,
  })
  public importSubscription(@Args() input: ImportPublicSubscriptionInput) {
    return this.service.importSubscription(input);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Updates an existing subscription.`,
  })
  public updateSubscription(@Args() input: UpdatePublicSubscriptionInput) {
    return this.service.updateSubscription(input);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => Boolean, {
    description: `Data correction: moves a subscription that is still on fromPaymentMethodId to toPaymentMethodId and changes nothing else. Unlike updateSubscription it also takes deactivated subscriptions and never touches invoices, periods or the payment provider. Returns whether it moved the subscription; swap the payment methods to undo it.`,
  })
  public updateSubscriptionPaymentMethod(
    @Args() args: UpdateSubscriptionPaymentMethodArgs
  ) {
    return this.service.updateSubscriptionPaymentMethod(args);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Cancels a subscription.`,
  })
  public cancelSubscription(@Args() input: CancelPublicSubscriptionInput) {
    return this.service.cancelSubscription(input);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Reactivates a deactivated subscription.`,
  })
  public reactivateSubscription(@Args('id') id: string) {
    return this.service.reactivateSubscription(id);
  }

  @Permissions(CanDeleteSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Deletes an existing subscription.`,
  })
  public deleteSubscription(@Args('id') id: string) {
    return this.service.deleteSubscription(id);
  }

  @Permissions(CanCreateSubscription)
  @Mutation(returns => PublicSubscription, {
    description: `Renews a subscription.`,
  })
  public renewSubscription(@Args('id') id: string) {
    return this.service.renewSubscription(id);
  }

  @ResolveField(() => [SubscriptionPeriod])
  async periods(@Parent() subscription: Subscription) {
    return this.periodDataloader.load(subscription.id);
  }

  @ResolveField(() => SubscriptionDeactivation)
  async deactivation(@Parent() subscription: Subscription) {
    return this.deactivationDataloader.load(subscription.id);
  }

  @ResolveField(() => MemberPlan)
  async memberPlan(@Parent() subscription: Subscription) {
    return this.memberPlanDataloader.load(subscription.memberPlanID);
  }

  @ResolveField(() => PaymentMethod)
  async paymentMethod(@Parent() subscription: Subscription) {
    return this.paymentMethodDataloader.load(subscription.paymentMethodID);
  }

  @ResolveField(() => [Property])
  async properties(
    @Parent() { properties }: Subscription,
    @CurrentUser() user: UserSession | undefined
  ) {
    return (properties as unknown as Property[])?.filter(
      prop =>
        prop.public || hasPermission(CanGetSubscription, permissionsOf(user))
    );
  }

  @ResolveField(() => String)
  async url(@Parent() subscription: Subscription) {
    return this.urlAdapter.getSubscriptionURL(subscription);
  }

  @ResolveField(() => SubscriptionPaymentMethodChange, {
    nullable: true,
    description: `A payment method change that is waiting for the reader to pay or authorize. Until it completes, the subscription keeps its payment method.`,
  })
  async pendingPaymentMethodChange(@Parent() subscription: Subscription) {
    return this.pendingPaymentMethodChangeDataloader.load(subscription.id);
  }

  @ResolveField(() => Boolean, {
    description: `Whether the reader can authorize the subscription's payment method anew, e.g. with a new card: only for payment methods renewals are charged with automatically.`,
  })
  async canRenewPaymentMethod(@Parent() subscription: Subscription) {
    return this.paymentMethodChanges.canRenew(subscription.paymentMethodID);
  }

  @ResolveField(() => Boolean)
  async canExtend(@Parent() subscription: Subscription) {
    const [
      deactivation,
      paymentMethod,
      unpaidAndUncanceledInvoice,
      windowSetting,
      pendingPaymentMethodChange,
    ] = await Promise.all([
      this.deactivationDataloader.load(subscription.id),
      this.paymentMethodDataloader.load(subscription.paymentMethodID),
      this.prisma.invoice.findFirst({
        where: {
          subscription: {
            userID: subscription.userID,
          },
          paidAt: null,
          canceledAt: null,
        },
      }),
      this.settingDataloader.load(SettingName.SUBSCRIPTION_EXTEND_WINDOW_DAYS),
      this.pendingPaymentMethodChangeDataloader.load(subscription.id),
    ]);

    const windowDays =
      typeof windowSetting?.value === 'number' ?
        windowSetting.value
      : DEFAULT_EXTEND_WINDOW_DAYS;

    /**
     * Can only extend when:
     *   Subscription is extendable
     *   Subscription is not deactivated
     *   Subscription is about to run out (within SUBSCRIPTION_EXTEND_WINDOW_DAYS)
     *   All invoices have been paid (or cancelled)
     *   The payment method is not being changed
     *   Not using a deprecated payment method
     */
    return !!(
      subscription.paidUntil &&
      subscription.extendable &&
      !deactivation &&
      +add(new Date(), { days: windowDays }) > +subscription.paidUntil &&
      !unpaidAndUncanceledInvoice &&
      !pendingPaymentMethodChange &&
      // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
      paymentMethod?.slug !== 'payrexx-subscription'
    );
  }

  @ResolveField(() => Boolean, {
    description: `Whether an upgrade of this subscription can still be undone, meaning it has been replaced by a subscription that has not been paid for yet.`,
  })
  async canRevertUpgrade(@Parent() subscription: Subscription) {
    const replacements = await this.prisma.subscription.findMany({
      where: {
        replacesSubscriptionID: subscription.id,
      },
      include: {
        invoices: {
          where: {
            paidAt: {
              not: null,
            },
          },
          take: 1,
        },
      },
    });

    return (
      replacements.length > 0 &&
      replacements.every(replacement => !replacement.invoices.length)
    );
  }

  @ResolveField(() => String, { nullable: true })
  async isActive(@Parent() parent: PSubscription) {
    const paymentMethod = await this.paymentMethodDataloader.load(
      parent.paymentMethodID
    );

    return isActiveSubscription({
      startsAt: parent.startsAt,
      paidUntil: parent.paidUntil,
      gracePeriod: paymentMethod?.gracePeriod ?? 0,
    });
  }

  @ResolveField(() => String, { nullable: true })
  async externalReward(
    @Parent() parent: PSubscription,
    @CurrentUser() user: UserSession | undefined
  ) {
    const canManage = hasPermission(
      [CanGetSubscription, CanGetSubscriptions],
      permissionsOf(user)
    );
    const isOwn = parent.userID === user?.user.id;

    const [memberPlan, isActive] = await Promise.all([
      this.memberPlanDataloader.load(parent.memberPlanID),
      this.isActive(parent),
    ]);

    if (canManage || (isOwn && isActive)) {
      return memberPlan?.externalReward;
    }

    return null;
  }
}
