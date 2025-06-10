import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {UserSubscriptionInput} from './subscription.model'
import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'
import {UserSubscriptionService} from './user-subscription.service'
import {PublicSubscription} from '@wepublish/membership/api'

@Resolver(() => PublicSubscription)
export class UserSubscriptionResolver {
  constructor(private readonly userSubscriptionService: UserSubscriptionService) {}

  @Authenticated()
  @Query(() => [PublicSubscription], {
    description: `This query returns the subscriptions of the authenticated user.`
  })
  async subscriptions(@CurrentUser() session: UserSession) {
    return this.userSubscriptionService.getUserSubscriptions(session.user.id)
  }

  @Authenticated()
  @Mutation(() => PublicSubscription, {
    nullable: true,
    description: `This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null`
  })
  async updateUserSubscription(
    @Args('id') id: string,
    @Args('input') input: UserSubscriptionInput,
    @CurrentUser() {user}: UserSession
  ) {
    return this.userSubscriptionService.updatePublicSubscription(id, {
      ...input,
      userID: user.id
    })
  }
}
