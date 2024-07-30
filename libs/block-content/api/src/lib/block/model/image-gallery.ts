import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'

// Objects

@ObjectType()
export class GalleryImageEdge {
  @Field(() => String, {nullable: true})
  caption?: string

  imageID!: string

  @Field(() => Image)
  image!: Image
}

@ObjectType()
export class ImageGalleryBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [GalleryImageEdge])
  images!: GalleryImageEdge[]
}

// Inputs

@InputType()
export class GalleryImageEdgeInput extends OmitType(GalleryImageEdge, ['image']) {}

@InputType()
export class ImageGalleryBlockInput extends OmitType(ImageGalleryBlock, ['images']) {
  @Field(() => [GalleryImageEdgeInput])
  images!: GalleryImageEdgeInput[]
}
