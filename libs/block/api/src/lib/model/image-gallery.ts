import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'

// Objects

@ObjectType()
export class GalleryImageEdge {
  @Field(() => String, {nullable: true})
  caption?: string

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
export class GalleryImageEdgeInput {
  @Field(() => String, {nullable: true})
  caption?: string

  @Field(() => ID)
  imageID!: string
}

@InputType()
export class ImageGalleryBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string
  @Field(() => [GalleryImageEdgeInput])
  images!: GalleryImageEdgeInput[]
}
