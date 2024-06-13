import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'

@ObjectType()
export class QuoteBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  quote?: string

  @Field(() => String, {nullable: true})
  author?: string

  @Field(() => Image, {nullable: true})
  image?: Image
}

@InputType()
export class QuoteBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  quote?: string

  @Field(() => String, {nullable: true})
  author?: string

  @Field(() => ID, {nullable: true})
  imageID?: string
}
