import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {BlockType} from '../block-type'

// Objects

@ObjectType()
export class GalleryImageEdge {
  @Field(() => String, {nullable: true})
  caption?: string

  @Field(() => ID)
  imageID!: string

  @Field(() => Image)
  image!: Image
}

@ObjectType()
export class ImageGalleryBlock {
  @Field()
  type: BlockType = BlockType.ImageGallery

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [GalleryImageEdge])
  images!: GalleryImageEdge[]
}

// Inputs

@InputType()
export class GalleryImageEdgeInput extends OmitType(GalleryImageEdge, ['image'], InputType) {}

@InputType()
export class ImageGalleryBlockInput extends OmitType(ImageGalleryBlock, ['images'], InputType) {
  @Field(() => [GalleryImageEdgeInput])
  images!: GalleryImageEdgeInput[]
}
