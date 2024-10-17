import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class InstagramPostBlock extends BaseBlock<typeof BlockType.InstagramPost> {
  @Field({nullable: true})
  postID?: string
}
