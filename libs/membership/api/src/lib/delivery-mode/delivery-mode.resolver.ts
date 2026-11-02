import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliverySuggestionKind, MailChannel } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Feature } from '@wepublish/features/api';
import {
  CanGetUser,
  CanGetUsers,
  CanManageUserDeliveryMode,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { MailAudienceInput } from '../mail-send/mail-send.model';
import {
  DeliveryChannelCount,
  DeliveryModeAudiencePreview,
  DeliveryModeBulkResult,
  DeliverySuggestionConfirmAllResult,
  DeliverySuggestionCounts,
  DeliverySuggestionModel,
  DeliverySuggestionRecomputeResult,
  PaginatedDeliveryChannelUsers,
  PaginatedDeliveryModeBulkChanges,
  PaginatedDeliverySuggestions,
  UserDeliveryPreferenceModel,
} from './delivery-mode.model';
import { DeliverySuggestionService } from './delivery-suggestion.service';
import { UserDeliveryPreferenceService } from './user-delivery-preference.service';

/** Per-user delivery mode of automated subscription mails: mail or letter. */
@Feature('paper-letters', 'paper-letter-flow')
@Resolver()
export class DeliveryModeResolver {
  constructor(
    private preferences: UserDeliveryPreferenceService,
    private suggestions: DeliverySuggestionService
  ) {}

  @Permissions(CanGetUser)
  @Query(() => UserDeliveryPreferenceModel, {
    description: `How a user's automated subscription mails are delivered`,
  })
  userDeliveryPreference(@Args('userId') userId: string) {
    return this.preferences.get(userId);
  }

  @Permissions(CanGetUser)
  @Query(() => DeliverySuggestionModel, {
    nullable: true,
    description: `The open suggestion for one user, if any`,
  })
  userDeliverySuggestion(@Args('userId') userId: string) {
    return this.suggestions.userSuggestion(userId);
  }

  @Permissions(CanGetUsers)
  @Query(() => [DeliveryChannelCount], {
    description: `How many people each channel reaches, the default channel first`,
  })
  deliveryChannelCounts() {
    return this.preferences.channelCounts();
  }

  @Permissions(CanGetUsers)
  @Query(() => PaginatedDeliveryChannelUsers, {
    description: `The people on one channel, by name, with how they got there`,
  })
  usersByDeliveryChannel(
    @Args('channel', { type: () => MailChannel }) channel: MailChannel,
    @Args('search', { nullable: true }) search?: string,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20
  ) {
    return this.preferences.listByChannel(
      channel,
      search,
      skip,
      Math.min(take, 100)
    );
  }

  @Permissions(CanGetUsers)
  @Query(() => PaginatedDeliverySuggestions, {
    description: `Open suggestions to move users to letters or back to mail`,
  })
  deliverySuggestions(
    @Args('kind', { type: () => DeliverySuggestionKind })
    kind: DeliverySuggestionKind,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20
  ) {
    return this.suggestions.list(kind, skip, take);
  }

  @Permissions(CanGetUsers)
  @Query(() => DeliverySuggestionCounts, {
    description: `How many suggestions are open, per direction`,
  })
  deliverySuggestionCounts() {
    return this.suggestions.counts();
  }

  @Permissions(CanManageUserDeliveryMode)
  @Query(() => DeliveryModeAudiencePreview, {
    description: `What switching an audience's delivery mode would touch`,
  })
  deliveryModeAudiencePreview(
    @Args('audience') audience: MailAudienceInput,
    @Args('channel', { type: () => MailChannel }) channel: MailChannel
  ) {
    return this.preferences.previewAudience(audience, channel);
  }

  @Permissions(CanManageUserDeliveryMode)
  @Query(() => PaginatedDeliveryModeBulkChanges, {
    description: `Recent bulk switches of an audience's delivery mode, newest first`,
  })
  deliveryModeBulkChanges(
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20,
    @Args('channel', { type: () => MailChannel, nullable: true })
    channel?: MailChannel
  ) {
    return this.preferences.listBulkChanges(skip, Math.min(take, 100), channel);
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => UserDeliveryPreferenceModel, {
    description: `Switch a user between mailed and printed subscription mails`,
  })
  async setUserDeliveryMode(
    @CurrentUser() session: UserSession,
    @Args('userId') userId: string,
    @Args('channel', { type: () => MailChannel }) channel: MailChannel,
    @Args('reason', { nullable: true }) reason?: string
  ) {
    await this.preferences.set(userId, channel, {
      origin: 'manual',
      reason,
      changedByUserId: session.user.id,
    });

    return this.preferences.get(userId);
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => Boolean, {
    description: `Apply one suggestion; refused when it no longer holds`,
  })
  async confirmDeliverySuggestion(
    @CurrentUser() session: UserSession,
    @Args('id') id: string
  ) {
    await this.suggestions.confirm(id, session.user.id);

    return true;
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => Boolean, {
    description: `Decline one suggestion: the user stays on their channel as a manual decision, never suggested again`,
  })
  async keepDeliverySuggestion(
    @CurrentUser() session: UserSession,
    @Args('id') id: string
  ) {
    await this.suggestions.keep(id, session.user.id);

    return true;
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => DeliverySuggestionConfirmAllResult, {
    description: `Apply every open suggestion of a direction`,
  })
  confirmAllDeliverySuggestions(
    @CurrentUser() session: UserSession,
    @Args('kind', { type: () => DeliverySuggestionKind })
    kind: DeliverySuggestionKind
  ) {
    return this.suggestions.confirmAll(kind, session.user.id);
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => DeliveryModeBulkResult, {
    description: `Switch everyone in an audience; letters skip people without a usable address`,
  })
  setDeliveryModeForAudience(
    @CurrentUser() session: UserSession,
    @Args('audience') audience: MailAudienceInput,
    @Args('channel', { type: () => MailChannel }) channel: MailChannel
  ) {
    return this.preferences.setForAudience(audience, channel, session.user.id);
  }

  @Permissions(CanManageUserDeliveryMode)
  @Mutation(() => DeliverySuggestionRecomputeResult, {
    description: `Rebuild the suggestions now instead of waiting for the night`,
  })
  async recomputeDeliverySuggestions(): Promise<DeliverySuggestionRecomputeResult> {
    const result = await this.suggestions.recomputeAll();

    return 'skipped' in result ?
        { toLetter: 0, toMail: 0, removed: 0 }
      : result;
  }
}
