import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { NewsletterList as PNewsletterList } from '@prisma/client';
import {
  CanCreateNewsletterList,
  CanDeleteNewsletterList,
  CanGetNewsletterLists,
  CanUpdateNewsletterList,
  CanUpdateNewsletterSubscribers,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import {
  CreateNewsletterListInput,
  NewsletterList,
  UpdateNewsletterListInput,
} from './newsletter-list.model';
import { NewsletterListService } from './newsletter-list.service';
import { NewsletterListMemberPlansDataloader } from './newsletter-list-member-plans.dataloader';

@Resolver(() => NewsletterList)
export class NewsletterListResolver {
  constructor(
    private lists: NewsletterListService,
    private memberPlansDataloader: NewsletterListMemberPlansDataloader
  ) {}

  @Permissions(CanGetNewsletterLists)
  @Query(() => [NewsletterList], {
    description: `Returns all newsletter lists.`,
  })
  newsletterLists() {
    return this.lists.list();
  }

  @Permissions(CanGetNewsletterLists)
  @Query(() => NewsletterList, {
    description: `Returns a newsletter list by id.`,
  })
  newsletterList(@Args('id') id: string) {
    return this.lists.get(id);
  }

  @Permissions(CanCreateNewsletterList)
  @Mutation(() => NewsletterList, {
    description: `Creates a newsletter list.`,
  })
  createNewsletterList(@Args() input: CreateNewsletterListInput) {
    return this.lists.create(input);
  }

  @Permissions(CanUpdateNewsletterList)
  @Mutation(() => NewsletterList, {
    description: `Updates a newsletter list.`,
  })
  updateNewsletterList(@Args() input: UpdateNewsletterListInput) {
    return this.lists.update(input);
  }

  @Permissions(CanDeleteNewsletterList)
  @Mutation(() => NewsletterList, {
    description: `Deletes a newsletter list including all of its subscribers.`,
  })
  deleteNewsletterList(@Args('id') id: string) {
    return this.lists.delete(id);
  }

  @Permissions(CanUpdateNewsletterSubscribers)
  @Mutation(() => Int, {
    description: `Adds every user with a qualifying subscription to a subscriber-only newsletter list and returns how many were added.`,
  })
  backfillNewsletterList(@Args('id') id: string) {
    return this.lists.backfill(id);
  }

  @ResolveField(() => [MemberPlan])
  memberPlans(@Parent() parent: PNewsletterList) {
    return this.memberPlansDataloader.load(parent.id);
  }
}
