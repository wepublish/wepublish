import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import Node from 'slate'
import {Image} from '@wepublish/image/api'
import {BlockType} from '../block-type'

// Objects

@ObjectType()
export class ListicleItem {
  @Field(() => String)
  title!: string

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@ObjectType()
export class ListicleBlock {
  @Field()
  type: BlockType = BlockType.Listicle

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [ListicleItem])
  items!: ListicleItem[]
}

// Inputs

@InputType()
export class ListicleItemInput extends OmitType(ListicleItem, ['image'], InputType) {}

@InputType()
export class ListicleBlockInput extends OmitType(ListicleBlock, ['items'], InputType) {
  @Field(() => [ListicleItemInput])
  items!: ListicleItemInput[]
}
