import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {PollBlock} from './poll-block.model'
import {Image} from '@wepublish/image/api'

@Resolver(() => PollBlock)
export class PollBlockResolver {
  @ResolveField(() => Image, {nullable: true})
  public image(@Parent() block: PollBlock) {
    const {pollId} = block

    if (!pollId) {
      return null
    }

    return {__typename: 'Poll', id: pollId}
  }
}
