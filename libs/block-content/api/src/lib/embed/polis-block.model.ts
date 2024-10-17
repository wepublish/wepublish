import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class PolisConversationBlock extends BaseBlock<typeof BlockType.PolisConversation> {
  @Field({nullable: true})
  conversationID?: string
}
