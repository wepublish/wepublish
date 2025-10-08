import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Image } from '@wepublish/image/api';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { HasImage } from '@wepublish/image/api';

@ObjectType({
  implements: () => [BaseBlock, HasImage],
})
export class QuoteBlock
  extends BaseBlock<typeof BlockType.Quote>
  implements HasImage
{
  @Field({ nullable: true })
  author?: string;

  @Field({ nullable: true })
  quote?: string;

  imageID?: string;
  image?: Image;
}

@InputType()
export class QuoteBlockInput extends OmitType(
  QuoteBlock,
  ['image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override imageID?: string;
}
