import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class YouTubeVideoBlock extends BaseBlock<typeof BlockType.YouTubeVideo> {
  @Field({nullable: true})
  videoID?: string
}
