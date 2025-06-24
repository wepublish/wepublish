import {Args, Query, Resolver} from '@nestjs/graphql'
import {ReadingListProgressArgs} from './reading-list.model'

import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'
import {ReadingListService} from './reading-list.service'

@Resolver()
export class ReadingListResolver {
  constructor(private articleService: ReadingListService) {}

  @Authenticated()
  @Query(() => Boolean, {
    description: `Saves the reading progress of the current user for a given article`
  })
  public async saveReadingListProgress(
    @CurrentUser() user: UserSession | undefined,
    @Args() args: ReadingListProgressArgs
  ) {
    return !!(await this.articleService.saveProgress(user!.user, args))
  }
}
