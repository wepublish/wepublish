import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class VimeoVideoBlock extends BaseBlock<typeof BlockType.VimeoVideo> {
  @Field({nullable: true})
  videoID?: string
}
