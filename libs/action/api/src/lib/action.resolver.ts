import { Args, Query, Resolver } from '@nestjs/graphql';
import { ActionService } from './action.service';
import { Action, ActionType } from './action.model';
import {
  CanGetArticle,
  CanGetPage,
  CanGetSubscription,
  CanGetAuthors,
  CanGetComments,
  CanGetPoll,
  CanGetUser,
  CanGetEvent,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { AuthSession, CurrentUser } from '@wepublish/authentication/api';

@Resolver(() => Action)
export class ActionResolver {
  constructor(readonly actionService: ActionService) {}

  @Permissions(
    CanGetArticle,
    CanGetPage,
    CanGetSubscription,
    CanGetAuthors,
    CanGetComments,
    CanGetPoll,
    CanGetUser,
    CanGetEvent
  )
  @Query(() => [Action], { description: `Returns latest actions` })
  async actions(
    @Args('types', {
      type: () => [ActionType],
      nullable: true,
      description: 'Only these kinds of actions. Empty or omitted means all.',
    })
    types: ActionType[] | null | undefined,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.actionService.getActions(types, session);
  }
}
