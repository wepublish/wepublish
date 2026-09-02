import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { NotificationConfirmation } from './notification-confirmation.model';
import { NotificationConfirmationService } from './notification-confirmation.service';
import { NotificationSource } from './notification-read.model';

@Resolver(() => NotificationConfirmation)
export class NotificationConfirmationResolver {
  constructor(
    private notificationConfirmationService: NotificationConfirmationService
  ) {}

  @Authenticated()
  @Query(returns => [NotificationConfirmation], {
    name: 'notificationConfirmations',
    description:
      'Returns the instance-wide notification confirmations. Requires authentication.',
  })
  notificationConfirmations() {
    return this.notificationConfirmationService.getNotificationConfirmations();
  }

  @Authenticated()
  @Mutation(returns => NotificationConfirmation, {
    name: 'confirmNotification',
    description:
      'Confirms a notification for the whole instance, recording who confirmed it. Requires authentication.',
  })
  confirmNotification(
    @Args('source', { type: () => NotificationSource })
    source: NotificationSource,
    @Args('itemId') itemId: string,
    @CurrentUser() session: UserSession
  ) {
    return this.notificationConfirmationService.confirmNotification(
      session.user.id,
      source,
      itemId
    );
  }
}
