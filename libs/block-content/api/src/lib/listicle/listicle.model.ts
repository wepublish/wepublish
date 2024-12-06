import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
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

@InputType()
export class ListicleItemInput extends OmitType(ListicleItem, ['image'] as const, InputType) {}

@ObjectType({
  implements: BaseBlock
})
export class ListicleBlock extends BaseBlock<typeof BlockType.Listicle> {
  @Field(() => [ListicleItem])
  items!: ListicleItem[]
}

@InputType()
export class ListicleBlockInput extends BaseBlock<typeof BlockType.Listicle> {
  @Field(() => [ListicleItemInput])
  items!: ListicleItemInput[]
}
