import {Query, Resolver} from '@nestjs/graphql'
import {ActionService} from './action.service'
import {CurrentUser, UserSession} from '@wepublish/authentication/api'
import {Action} from './action.model'
import {CanGetNavigations, Permissions} from '@wepublish/permissions/api'

@Resolver(() => Action)
export class ActionResolver {
  constructor(readonly actionService: ActionService) {}

  @Query(() => [Action], {description: `Returns latest user actions`})
  @Permissions(CanGetNavigations)
  async actions(@CurrentUser() user: UserSession): Promise<Array<typeof Action>> {
    return this.actionService.getActions(user?.roles ?? [])
  }
}
