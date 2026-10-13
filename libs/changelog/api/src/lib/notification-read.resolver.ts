import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import {
  NotificationRead,
  NotificationSource,
} from './notification-read.model';
import { NotificationReadService } from './notification-read.service';

@Resolver(() => NotificationRead)
export class NotificationReadResolver {
  constructor(private notificationReadService: NotificationReadService) {}

  @Authenticated()
  @Query(returns => [NotificationRead], {
    name: 'notificationReads',
    description:
      "Returns the current user's read notifications. Requires authentication.",
  })
  notificationReads(@CurrentUser() session: UserSession) {
    return this.notificationReadService.getNotificationReads(session.user.id);
  }

  @Authenticated()
  @Mutation(returns => NotificationRead, {
    name: 'markNotificationRead',
    description:
      'Marks a notification as read for the current user. Requires authentication.',
  })
  markNotificationRead(
    @Args('source', { type: () => NotificationSource })
    source: NotificationSource,
    @Args('itemId') itemId: string,
    @CurrentUser() session: UserSession
  ) {
    return this.notificationReadService.markNotificationRead(
      session.user.id,
      source,
      itemId
    );
  }
}
