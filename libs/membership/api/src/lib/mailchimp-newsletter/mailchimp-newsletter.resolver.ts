import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import {
  Authenticated,
  AuthSessionType,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import {
  UpdateUserNewslettersInput,
  UserNewsletterGroup,
} from './mailchimp-newsletter.model';
import { MailchimpNewsletterService } from './mailchimp-newsletter.service';

@Resolver()
export class MailchimpNewsletterResolver {
  constructor(private newsletterService: MailchimpNewsletterService) {}

  @Authenticated()
  @Query(() => [UserNewsletterGroup], {
    description: `Returns the newsletters the user can subscribe to and whether they are subscribed.`,
  })
  async userNewsletters(@CurrentUser() session: UserSession) {
    if (session?.type !== AuthSessionType.User) {
      return [];
    }

    return this.newsletterService.getUserNewsletters(session.user.email);
  }

  @Authenticated()
  @Mutation(() => UserNewsletterGroup, {
    description: `Subscribes or unsubscribes the user from the given newsletters.`,
  })
  async updateUserNewsletters(
    @CurrentUser() session: UserSession,
    @Args('input') input: UpdateUserNewslettersInput
  ) {
    if (session?.type !== AuthSessionType.User) {
      throw new BadRequestException('Only users can manage newsletters.');
    }

    return this.newsletterService.updateUserNewsletters(
      session.user.email,
      input
    );
  }
}
