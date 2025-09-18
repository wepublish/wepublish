import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { ImageBlock } from './image-block.model';
import { HasImage } from '@wepublish/image/api';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: () => [HasImage],
})
export class ImageGalleryImage extends PickType(ImageBlock, [
  'imageID',
  'image',
  'caption',
] as const) {}

@ObjectType({
  implements: BaseBlock,
})
export class ImageGalleryBlock extends BaseBlock<
  typeof BlockType.ImageGallery
> {
  @Field(() => [ImageGalleryImage])
  images!: ImageGalleryImage[];
}

@InputType()
export class ImageGalleryImageInput extends OmitType(
  ImageGalleryImage,
  ['image'] as const,
  InputType
) {
  @Field({ nullable: true })
  override imageID?: string;
}

@InputType()
export class ImageGalleryBlockInput extends OmitType(
  ImageGalleryBlock,
  ['images', 'type'] as const,
  InputType
) {
  @Field(() => [ImageGalleryImageInput])
  images!: ImageGalleryImageInput[];
}
