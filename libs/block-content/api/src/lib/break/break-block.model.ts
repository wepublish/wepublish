import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Image } from '@wepublish/image/api';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Descendant } from 'slate';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { HasImage } from '@wepublish/image/api';

@ObjectType({
  implements: () => [BaseBlock, HasImage],
})
export class BreakBlock
  extends BaseBlock<typeof BlockType.LinkPageBreak>
  implements HasImage
{
  @Field({ nullable: true })
  text?: string;
  @Field(() => GraphQLRichText)
  richText!: Descendant[];

  @Field({ nullable: true })
  linkURL?: string;
  @Field({ nullable: true })
  linkText?: string;
  @Field({ nullable: true })
  linkTarget?: string;
  @Field({ nullable: true })
  hideButton?: boolean;

  imageID?: string;
  image?: Image;
}

@InputType()
export class BreakBlockInput extends OmitType(
  BreakBlock,
  ['image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override imageID?: string;
}
