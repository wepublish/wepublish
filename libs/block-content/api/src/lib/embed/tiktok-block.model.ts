import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class TikTokVideoBlock extends BaseBlock<typeof BlockType.TikTokVideo> {
  @Field({nullable: true})
  userID?: string

  @Field({nullable: true})
  videoID?: string
}
