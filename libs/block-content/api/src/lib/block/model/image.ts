import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'

@ObjectType()
export class ImageBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => Image)
  image!: Image

  @Field(() => String, {nullable: true})
  caption?: string

  @Field(() => String, {nullable: true})
  linkUrl?: string
}

@InputType()
export class ImageBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  caption?: string

  @Field(() => String, {nullable: true})
  linkUrl?: string

  @Field(() => ID)
  imageID!: string
}
