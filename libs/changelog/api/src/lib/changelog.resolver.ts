import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { CanUpdateSettings } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  ChangelogEntry,
  ChangelogEntryListArgs,
  PaginatedChangelogEntries,
} from './changelog-entry.model';
import { ChangelogService } from './changelog.service';

@Resolver(() => ChangelogEntry)
export class ChangelogResolver {
  constructor(private changelogService: ChangelogService) {}

  @Authenticated()
  @Query(returns => PaginatedChangelogEntries, {
    name: 'changelogEntries',
    description:
      'Returns the changelog entries of this instance, newest first. Requires authentication.',
  })
  changelogEntries(@Args() args: ChangelogEntryListArgs) {
    return this.changelogService.getChangelogEntries(args);
  }

  // Signing an entry off speaks for the whole instance — the notice then
  // disappears for everyone, including the people who would have had to act.
  // That is an administrator's call, not every editor's.
  @Permissions(CanUpdateSettings)
  @Mutation(returns => ChangelogEntry, {
    name: 'confirmChangelogEntry',
    description:
      'Confirms that the manual action required by a changelog entry has been completed. Requires the permission to update settings.',
  })
  confirmChangelogEntry(
    @Args('id') id: string,
    @CurrentUser() session: UserSession,
    @Args('locale', { nullable: true }) locale?: string
  ) {
    return this.changelogService.confirmChangelogEntry(
      id,
      session.user.id,
      locale
    );
  }
}
