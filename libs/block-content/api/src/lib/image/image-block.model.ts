import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Image } from '@wepublish/image/api';
import { HasImage } from '@wepublish/image/api';

@ObjectType({
  implements: () => [BaseBlock, HasImage],
})
export class ImageBlock
  extends BaseBlock<typeof BlockType.Image>
  implements HasImage
{
  imageID?: string;
  image?: Image;

  @Field({ nullable: true })
  caption?: string;
  @Field({ nullable: true })
  linkUrl?: string;
}

@InputType()
export class ImageBlockInput extends OmitType(
  ImageBlock,
  ['image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override imageID?: string;
}
