import { Query, Resolver } from '@nestjs/graphql';
import { ActionService } from './action.service';
import { Action } from './action.model';
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
  async actions() {
    return this.actionService.getActions();
  }
}
