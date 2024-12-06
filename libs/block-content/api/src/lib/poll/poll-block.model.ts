import {InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {FullPoll, HasOptionalPoll} from '@wepublish/poll/api'

@ObjectType({
  implements: [BaseBlock, HasOptionalPoll]
})
export class PollBlock extends BaseBlock<typeof BlockType.Poll> implements HasOptionalPoll {
  pollId?: string
  poll?: FullPoll
}

@InputType()
export class PollBlockInput extends OmitType(PollBlock, ['poll'] as const, InputType) {}
