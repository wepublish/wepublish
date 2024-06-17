import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {GraphQLBoolean} from 'graphql/index'
import {Image} from '@wepublish/image/api'

@ObjectType()
export class LinkPageBreakBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  text?: string

  @Field(() => GraphQLRichText)
  richText!: string

  @Field(() => String, {nullable: true})
  linkURL?: string

  @Field(() => String, {nullable: true})
  linkText?: string

  @Field(() => String, {nullable: true})
  linkTarget?: string

  @Field(() => GraphQLBoolean)
  hideButton!: boolean

  @Field(() => String, {nullable: true})
  styleOption?: string

  @Field(() => String, {nullable: true})
  layoutOption?: string

  @Field(() => String, {nullable: true})
  templateOption?: string

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image
}

@InputType()
export class LinkPageBreakBlockInput extends OmitType(LinkPageBreakBlock, ['image']) {}
