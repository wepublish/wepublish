import { Field, InputType, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Teaser, TeaserInput } from './teaser.model';
import type { BlockContentInput } from '../block-content.model';

// We need to use a lazy type reference to avoid circular dependency
const getBlockContentType = () => {
  const { BlockContent } = require('../block-content.model');
  return BlockContent;
};

const getBlockContentInputType = () => {
  const { BlockContentInput } = require('../block-content.model');
  return BlockContentInput;
};

@ObjectType()
export class FlexAlignment {
  @Field()
  i!: string;

  @Field(() => Int)
  x!: number;
  @Field(() => Int)
  y!: number;

  @Field(() => Int)
  w!: number;
  @Field(() => Int)
  h!: number;

  @Field()
  static!: boolean;
}

@InputType()
export class FlexAlignmentInput extends OmitType(
  FlexAlignment,
  [] as const,
  InputType
) {}

@ObjectType()
export class FlexTeaser {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment;

  @Field(() => Teaser, { nullable: true })
  teaser?: typeof Teaser | null;

  @Field(() => getBlockContentType, { nullable: true })
  block?: BaseBlock<BlockType> | null;
}

@InputType()
export class FlexTeaserInput extends OmitType(
  FlexTeaser,
  ['teaser', 'alignment', 'block'] as const,
  InputType
) {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput;

  @Field(() => TeaserInput, { nullable: true })
  teaser?: TeaserInput | null;

  @Field(() => getBlockContentInputType, { nullable: true })
  block?: BlockContentInput | null;
}

@ObjectType({
  implements: () => [BaseBlock],
})
export class TeaserGridFlexBlock extends BaseBlock<BlockType.TeaserGridFlex> {
  @Field(() => [FlexTeaser])
  flexTeasers!: FlexTeaser[];
}

@InputType()
export class TeaserGridFlexBlockInput extends OmitType(
  TeaserGridFlexBlock,
  ['flexTeasers', 'type'] as const,
  InputType
) {
  @Field(() => [FlexTeaserInput])
  flexTeasers!: FlexTeaserInput[];
}

export function isTeaserGridFlexBlock(
  block: BaseBlock<BlockType>
): block is TeaserGridFlexBlock {
  return block.type === BlockType.TeaserGridFlex;
}
