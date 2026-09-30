import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { MyNewsletterList } from './my-newsletter-list.model';
import { NewsletterSubscriberService } from './newsletter-subscriber.service';

@Resolver(() => MyNewsletterList)
export class NewsletterMemberResolver {
  constructor(private subscribers: NewsletterSubscriberService) {}

  @Authenticated()
  @Query(() => [MyNewsletterList], {
    description: `Returns the newsletter lists the current user can see, with their subscription status.`,
  })
  myNewsletterLists(@CurrentUser() { user }: UserSession) {
    return this.subscribers.getMyLists(user.id);
  }

  @Authenticated()
  @Mutation(() => MyNewsletterList, {
    description: `Subscribes the current user to a newsletter list.`,
  })
  subscribeToNewsletterList(
    @Args('listId') listId: string,
    @CurrentUser() { user }: UserSession
  ) {
    return this.subscribers.subscribe(user.id, listId);
  }

  @Authenticated()
  @Mutation(() => MyNewsletterList, {
    description: `Unsubscribes the current user from a newsletter list.`,
  })
  unsubscribeFromNewsletterList(
    @Args('listId') listId: string,
    @CurrentUser() { user }: UserSession
  ) {
    return this.subscribers.unsubscribe(user.id, listId);
  }

  @Public()
  @Mutation(() => [MyNewsletterList], {
    description: `Confirms the newsletter double opt-in with the token from the confirmation mail.`,
  })
  confirmNewsletterSubscription(@Args('token') token: string) {
    return this.subscribers.confirm(token);
  }
}
