import { Field, InputType, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import type { BlockContentInput } from '../block-content.model';
import { HasOneBlockContent, BlockContent } from '../block-content.model';

@ObjectType()
export class FlexAlignmentBlocks {
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
export class FlexAlignmentBlocksInput extends OmitType(
  FlexAlignmentBlocks,
  [] as const,
  InputType
) {}

@ObjectType({
  implements: () => [HasOneBlockContent],
})
export class NestedBlock implements HasOneBlockContent {
  @Field(() => FlexAlignmentBlocks)
  alignment!: FlexAlignmentBlocks;

  @Field(() => BlockContent, { nullable: true })
  block!: typeof BlockContent | null;
}

@InputType()
export class NestedBlockInput extends OmitType(
  NestedBlock,
  ['block', 'alignment'] as const,
  InputType
) {
  @Field(() => FlexAlignmentBlocksInput)
  alignment!: FlexAlignmentBlocksInput;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @Field(() => require('../block-content.model').BlockContentInput, {
    nullable: true,
  })
  block!: BlockContentInput | null;
}

@ObjectType({
  implements: [BaseBlock],
})
export class FlexBlock extends BaseBlock<typeof BlockType.FlexBlock> {
  @Field(() => [NestedBlock])
  nestedBlocks!: NestedBlock[];
}

@InputType()
export class FlexBlockInput extends OmitType(
  FlexBlock,
  ['nestedBlocks', 'type'] as const,
  InputType
) {
  @Field(() => [NestedBlockInput])
  nestedBlocks!: NestedBlockInput[];

  @Field(() => BlockType)
  type!: typeof BlockType.FlexBlock;
}

/*
@InputType()
export class TeaserSlotsBlockInput extends OmitType(
  TeaserSlotsBlock,
  ['teasers', 'autofillTeasers', 'slots', 'autofillConfig', 'type'] as const,
  InputType
) {
  @Field(() => [TeaserSlotInput])
  slots!: Array<TeaserSlotInput>;

  @Field(() => TeaserSlotsAutofillConfigInput)
  autofillConfig!: TeaserSlotsAutofillConfigInput;
}
*/

export function isFlexBlock(block: BaseBlock<BlockType>): block is FlexBlock {
  return block.type === BlockType.FlexBlock;
}
