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
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import {
  CanCreateSubscription,
  CanDeleteSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
  CanGetUsers,
} from '@wepublish/permissions';
import { isActiveSubscription } from './is-subscription-active';
import {
  Property,
  SubscriptionPropertyDataloader,
} from '@wepublish/property/api';
import { SubscriptionService } from './subscription.service';
import { SubscriptionDataloader } from './subscription.dataloader';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionPeriodDataloader } from './subscription-periods.dataloader';

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
    private propertyDataLoader: SubscriptionPropertyDataloader
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
  @Mutation(returns => PublicSubscription, {
    description: `Cancels a subscription.`,
  })
  public cancelSubscription(@Args() input: CancelPublicSubscriptionInput) {
    return this.service.cancelSubscription(input);
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
    @Parent() subscription: Subscription,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = await this.propertyDataLoader.load(subscription.id);

    return properties?.filter(
      prop =>
        prop.public || hasPermission(CanGetSubscription, user?.roles ?? [])
    );
  }

  @ResolveField(() => String)
  async url(@Parent() subscription: Subscription) {
    return this.urlAdapter.getSubscriptionURL(subscription);
  }

  @ResolveField(() => Boolean)
  async canExtend(@Parent() subscription: Subscription) {
    const [deactivation, paymentMethod, unpaidAndUncanceledInvoice] =
      await Promise.all([
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
      ]);

    /**
     * Can only extend when:
     *   Subscription is extendable
     *   Subscription is not deactivated
     *   Subscription is about to run out (less than 1 month)
     *   All invoices have been paid (or cancelled)
     *   Not using a deprecated payment method
     */
    return !!(
      subscription.paidUntil &&
      subscription.extendable &&
      !deactivation &&
      +add(new Date(), { months: 1 }) > +subscription.paidUntil &&
      !unpaidAndUncanceledInvoice &&
      // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
      paymentMethod?.slug !== 'payrexx-subscription'
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
      user?.roles ?? []
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
