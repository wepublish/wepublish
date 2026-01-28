import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CreateSubscriptionArgs,
  CreateSubscriptionWithConfirmationArgs,
  ExtendSubscriptionArgs,
  UserSubscriptionInput,
} from './subscription.model';
import {
  Authenticated,
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { UserSubscriptionService } from './user-subscription.service';
import { PublicSubscription } from '@wepublish/membership/api';
import { Payment } from '@wepublish/payment/api';
import { UserDataloaderService } from '@wepublish/user/api';
import { BadRequestException } from '@nestjs/common';

@Resolver()
export class UserSubscriptionResolver {
  constructor(
    private userSubscriptionService: UserSubscriptionService,
    private userDataloader: UserDataloaderService
  ) {}

  @Authenticated()
  @Query(() => [PublicSubscription], {
    description: `This query returns the subscriptions of the authenticated user.`,
  })
  async subscriptions(@CurrentUser() session: UserSession) {
    return this.userSubscriptionService.getUserSubscriptions(session.user.id);
  }

  @Authenticated()
  @Mutation(() => Payment, {
    description: `Allows authenticated users to create additional subscriptions`,
  })
  async createSubscription(
    @Args() args: CreateSubscriptionArgs,
    @CurrentUser() { user }: UserSession
  ) {
    return this.userSubscriptionService.createSubscription(user.id, args);
  }

  @Public()
  @Mutation(() => Boolean, {
    description: `Allows guests and authenticated users to create additional subscriptions`,
  })
  async createSubscriptionWithConfirmation(
    @Args() { userId, ...args }: CreateSubscriptionWithConfirmationArgs,
    @CurrentUser() session?: UserSession
  ) {
    const user =
      userId ? await this.userDataloader.load(userId) : session?.user;

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userSubscriptionService.createSubscriptionWithConfirmation(
      user.id,
      args
    );
    return true;
  }

  @Authenticated()
  @Mutation(() => Payment, {
    description: `Allows authenticated users to extend existing subscriptions`,
  })
  async extendSubscription(
    @Args() args: ExtendSubscriptionArgs,
    @CurrentUser() { user }: UserSession
  ) {
    return this.userSubscriptionService.extendSubscription(user.id, args);
  }

  @Authenticated()
  @Mutation(() => PublicSubscription, {
    nullable: true,
    description: `This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null`,
  })
  async updateUserSubscription(
    @Args('id') id: string,
    @Args('input') input: UserSubscriptionInput,
    @CurrentUser() { user }: UserSession
  ) {
    return this.userSubscriptionService.updateSubscription(id, {
      ...input,
      userID: user.id,
    });
  }

  @Authenticated()
  @Mutation(() => PublicSubscription, {
    nullable: true,
    description: `This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null`,
  })
  async cancelUserSubscription(
    @Args('id') id: string,
    @CurrentUser() { user }: UserSession
  ) {
    return this.userSubscriptionService.cancelUserSubscription(user.id, id);
  }
}
