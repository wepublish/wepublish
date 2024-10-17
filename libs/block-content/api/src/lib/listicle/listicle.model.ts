import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '@prisma/client'
import {HasImage, Image} from '@wepublish/image/api'
import {Node} from 'slate'
import {GraphQLRichText} from '@wepublish/richtext/api'

@ObjectType({
  implements: () => [HasImage]
})
export class ListicleItem implements HasImage {
  image?: Image
  imageID?: string

  @Field(() => GraphQLRichText)
  richText!: Node[]

  @Field({nullable: true})
  title?: string
}

@ObjectType({
  implements: BaseBlock
})
export class ListicleBlock extends BaseBlock<typeof BlockType.Listicle> {
  @Field(() => [ListicleItem])
  items!: ListicleItem[]
}
