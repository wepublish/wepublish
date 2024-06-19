import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class PolisConversationBlock {
  @Field()
  type: BlockType = BlockType.PolisConversation

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  conversationID!: string
}

@InputType()
export class PolisConversationBlockInput extends OmitType(PolisConversationBlock, [], InputType) {}
