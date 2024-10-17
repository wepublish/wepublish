import {Field, ObjectType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {HasImage} from '@wepublish/image/api'

@ObjectType({
  implements: () => [BaseBlock, HasImage]
})
export class QuoteBlock extends BaseBlock<typeof BlockType.Quote> implements HasImage {
  @Field({nullable: true})
  author?: string

  @Field({nullable: true})
  quote?: string

  imageID?: string
  image?: Image
}
