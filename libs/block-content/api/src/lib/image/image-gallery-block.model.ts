import {Field, InputType, ObjectType, OmitType, PickType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '@prisma/client'
import {ImageBlock} from './image-block.model'
import {HasImage} from '@wepublish/image/api'

@ObjectType({
  implements: () => [HasImage]
})
export class ImageGalleryImage extends PickType(ImageBlock, [
  'imageID',
  'image',
  'caption'
] as const) {}

@ObjectType({
  implements: BaseBlock
})
export class ImageGalleryBlock extends BaseBlock<typeof BlockType.ImageGallery> {
  @Field(() => [ImageGalleryImage])
  images!: ImageGalleryImage[]
}

@InputType()
export class ImageGalleryImageInput extends OmitType(
  ImageGalleryImage,
  ['image'] as const,
  InputType
) {}

@InputType()
export class ImageGalleryBlockInput extends BaseBlock<typeof BlockType.ImageGallery> {
  @Field(() => [ImageGalleryImageInput])
  images!: ImageGalleryImageInput[]
}
