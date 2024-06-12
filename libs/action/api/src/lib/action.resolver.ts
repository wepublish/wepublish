import {Query, Resolver} from '@nestjs/graphql'
import {ActionService} from './action.service'
import {Action} from './action.model'

@Resolver(() => Action)
export class ActionResolver {
  constructor(readonly actionService: ActionService) {}

  @Query(() => [Action], {description: `Returns latest actions`})
  async actions() {
    return this.actionService.getActions()
  }
}
