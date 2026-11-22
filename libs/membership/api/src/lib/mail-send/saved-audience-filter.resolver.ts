import { ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  actorOf,
  Authenticated,
  AuthSession,
  CurrentUser,
} from '@wepublish/authentication/api';
import {
  CanManageUserDeliveryMode,
  CanSendMailTemplates,
} from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import {
  CreateSavedAudienceFilterInput,
  SavedAudienceFilterModel,
  UpdateSavedAudienceFilterInput,
} from './saved-audience-filter.model';
import { SavedAudienceFilterService } from './saved-audience-filter.service';

/**
 * The recipient filter is the same in the manual messages and in the manual
 * channel assignment, and so are its saved filters: whoever may use one of
 * the two tools may use them. `@Permissions` asks for every permission it is
 * given, so "either of two" is checked here.
 */
const USED_BY = [CanSendMailTemplates, CanManageUserDeliveryMode];

@Resolver(() => SavedAudienceFilterModel)
export class SavedAudienceFilterResolver {
  constructor(private filters: SavedAudienceFilterService) {}

  @Authenticated()
  @Query(() => [SavedAudienceFilterModel], {
    description:
      'The saved recipient filters, by name. Needs the permission to send manual messages or to manage delivery channels.',
  })
  async savedAudienceFilters(@CurrentUser() session: AuthSession) {
    this.assertMayUse(session);

    return this.filters.list();
  }

  @Authenticated()
  @Mutation(() => SavedAudienceFilterModel, {
    description: 'Save a recipient filter under a name.',
  })
  async createSavedAudienceFilter(
    @CurrentUser() session: AuthSession,
    @Args('input') input: CreateSavedAudienceFilterInput
  ) {
    this.assertMayUse(session);

    return this.filters.create(input, actorOf(session).userId);
  }

  @Authenticated()
  @Mutation(() => SavedAudienceFilterModel, {
    description:
      'Rename a saved recipient filter, change its description or replace the filter it holds.',
  })
  async updateSavedAudienceFilter(
    @CurrentUser() session: AuthSession,
    @Args('id') id: string,
    @Args('input') input: UpdateSavedAudienceFilterInput
  ) {
    this.assertMayUse(session);

    return this.filters.update(id, input);
  }

  @Authenticated()
  @Mutation(() => SavedAudienceFilterModel, {
    description: 'Delete a saved recipient filter.',
  })
  async deleteSavedAudienceFilter(
    @CurrentUser() session: AuthSession,
    @Args('id') id: string
  ) {
    this.assertMayUse(session);

    return this.filters.delete(id);
  }

  private assertMayUse(session: AuthSession) {
    const granted = permissionsOf(session);

    if (!USED_BY.some(permission => hasPermission(permission, granted))) {
      throw new ForbiddenException(
        'Saved recipient filters need the permission to send manual messages or to manage delivery channels.'
      );
    }
  }
}
