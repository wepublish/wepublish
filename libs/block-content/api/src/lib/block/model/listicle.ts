import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import Node from 'slate'
import {Image} from '@wepublish/image/api'

// Objects

@ObjectType()
export class ListicleItem {
  @Field(() => String)
  title!: string

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@ObjectType()
export class ListicleBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [ListicleItem])
  items!: ListicleItem[]
}

// Inputs

@InputType()
export class ListicleItemInput {
  @Field(() => String)
  title!: string

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@InputType()
export class ListicleBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [ListicleItemInput])
  items!: ListicleItemInput[]
}
