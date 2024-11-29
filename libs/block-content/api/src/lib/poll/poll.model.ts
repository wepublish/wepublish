import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '@prisma/client'
import {FullPoll} from '@wepublish/poll/api'

@ObjectType({
  implements: BaseBlock
})
export class PollBlock extends BaseBlock<typeof BlockType.Poll> {
  @Field({nullable: true})
  pollId?: string
  @Field(() => FullPoll, {nullable: true})
  poll?: FullPoll
}

@InputType()
export class PollBlockInput extends OmitType(PollBlock, ['poll'] as const, InputType) {}
