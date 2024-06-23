import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {BlockType} from '../block-type'

@ObjectType()
export class ImageBlock {
  @Field()
  type: BlockType = BlockType.Image

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  caption?: string

  @Field(() => String, {nullable: true})
  linkUrl?: string

  @Field(() => ID)
  imageID!: string

  @Field(() => Image)
  image!: Image
}

@InputType()
export class ImageBlockInput extends OmitType(ImageBlock, ['image'], InputType) {}
