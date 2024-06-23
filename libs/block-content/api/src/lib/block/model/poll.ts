import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class PollBlock {
  @Field()
  type: BlockType = BlockType.Poll

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => ID, {nullable: true})
  pollId?: string

  // @Field(() => Poll)
  // poll!: Poll;
}

@InputType()
export class PollBlockInput extends OmitType(PollBlock, [], InputType) {}
