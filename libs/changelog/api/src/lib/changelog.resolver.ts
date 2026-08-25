import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
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

  @Authenticated()
  @Mutation(returns => ChangelogEntry, {
    name: 'confirmChangelogEntry',
    description:
      'Confirms that the manual action required by a changelog entry has been completed. Requires authentication.',
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
