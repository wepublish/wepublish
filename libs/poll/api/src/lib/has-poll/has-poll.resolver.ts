import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasPoll, HasOptionalPoll} from './has-poll.model'
import {FullPoll} from '../poll.model'

@Resolver(() => HasOptionalPoll)
@Resolver(() => HasPoll)
export class HasPollResolver {
  @ResolveField(() => FullPoll, {nullable: true})
  public poll(@Parent() {pollId}: HasOptionalPoll | HasPoll) {
    if (!pollId) {
      return null
    }

    return {
      __typename: 'FullPoll',
      id: pollId
    }
  }
}
