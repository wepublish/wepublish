import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {BlockType} from '../block-type'

@ObjectType()
export class QuoteBlock {
  @Field()
  type: BlockType = BlockType.Quote

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  quote?: string

  @Field(() => String, {nullable: true})
  author?: string

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image
}

@InputType()
export class QuoteBlockInput extends OmitType(QuoteBlock, ['image'], InputType) {}
