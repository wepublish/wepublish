import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { HasImage, Image } from '@wepublish/image/api';
import { Descendant } from 'slate';
import { GraphQLRichText } from '@wepublish/richtext/api';

@ObjectType({
  implements: () => [HasImage],
})
export class ListicleItem implements HasImage {
  image?: Image;
  imageID?: string;

  @Field(() => GraphQLRichText)
  richText!: Descendant[];

  @Field({ nullable: true })
  title?: string;
}

@InputType()
export class ListicleItemInput extends OmitType(
  ListicleItem,
  ['image'] as const,
  InputType
) {
  @Field({ nullable: true })
  override imageID?: string;
}

@ObjectType({
  implements: BaseBlock,
})
export class ListicleBlock extends BaseBlock<typeof BlockType.Listicle> {
  @Field(() => [ListicleItem])
  items!: ListicleItem[];
}

@InputType()
export class ListicleBlockInput extends OmitType(
  ListicleBlock,
  ['items', 'type'] as const,
  InputType
) {
  @Field(() => [ListicleItemInput])
  items!: ListicleItemInput[];
}
