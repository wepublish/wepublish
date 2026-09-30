import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanGetNewsletterSubscribers,
  CanUpdateNewsletterSubscribers,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { UserDataloaderService } from '@wepublish/user/api';
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser } from '@wepublish/user/api';
import {
  NewsletterSubscriber,
  NewsletterSubscriberCounts,
  NewsletterSubscriberFilter,
  PaginatedNewsletterSubscribers,
} from './newsletter-subscriber.model';
import { NewsletterSubscriberAdminService } from './newsletter-subscriber-admin.service';

@Resolver(() => NewsletterSubscriber)
export class NewsletterSubscriberAdminResolver {
  constructor(
    private admin: NewsletterSubscriberAdminService,
    private userDataloader: UserDataloaderService
  ) {}

  @Permissions(CanGetNewsletterSubscribers)
  @Query(() => PaginatedNewsletterSubscribers, {
    description: `Returns a paginated list of the subscribers of a newsletter list.`,
  })
  newsletterSubscribers(
    @Args('listId') listId: string,
    @Args('filter', { nullable: true }) filter?: NewsletterSubscriberFilter,
    @Args('take', { type: () => Int, defaultValue: 25 }) take?: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip?: number
  ) {
    return this.admin.listSubscribers(
      listId,
      { ...filter },
      take ?? 25,
      skip ?? 0
    );
  }

  @Permissions(CanGetNewsletterSubscribers)
  @Query(() => NewsletterSubscriberCounts, {
    description: `Returns how many subscribers of a newsletter list are subscribed, pending or unsubscribed.`,
  })
  newsletterSubscriberCounts(@Args('listId') listId: string) {
    return this.admin.countSubscribers(listId);
  }

  @Permissions(CanGetNewsletterSubscribers)
  @Query(() => NewsletterSubscriber, {
    nullable: true,
    description: `Returns the entry of a user on a newsletter list, if there is one.`,
  })
  newsletterSubscriber(
    @Args('listId') listId: string,
    @Args('userId') userId: string
  ) {
    return this.admin.getSubscriber(listId, userId);
  }

  @Permissions(CanUpdateNewsletterSubscribers)
  @Mutation(() => NewsletterSubscriber, {
    description: `Adds a user to a newsletter list. Re-adding a user who unsubscribed requires force.`,
  })
  addNewsletterSubscriber(
    @Args('listId') listId: string,
    @Args('userId') userId: string,
    @Args('force', { defaultValue: false }) force?: boolean
  ) {
    return this.admin.addByEditor(listId, userId, force ?? false);
  }

  @Permissions(CanUpdateNewsletterSubscribers)
  @Mutation(() => NewsletterSubscriber, {
    description: `Removes a user from a newsletter list. The opt-out is kept.`,
  })
  removeNewsletterSubscriber(
    @Args('listId') listId: string,
    @Args('userId') userId: string
  ) {
    return this.admin.removeByEditor(listId, userId);
  }

  @ResolveField(() => SensitiveDataUser)
  user(@Parent() { userId }: NewsletterSubscriber) {
    return this.userDataloader.load(userId);
  }
}
