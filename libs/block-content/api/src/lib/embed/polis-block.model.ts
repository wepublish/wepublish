import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class PolisConversationBlock extends BaseBlock<
  typeof BlockType.PolisConversation
> {
  @Field({ nullable: true })
  conversationID?: string;
}

@InputType()
export class PolisConversationBlockInput extends OmitType(
  PolisConversationBlock,
  ['type'] as const,
  InputType
) {}
