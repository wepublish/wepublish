import {
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
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
  //@Field(() => [BaseBlock], { nullable: 'items' })
  //nestedBlocks!: Array<BaseBlock<BlockType> | null>;

  @Field(() => [NestedBlock])
  nestedBlocks!: NestedBlock[];
}

@InputType()
export class FlexBlockInput extends PartialType(
  OmitType(FlexBlock, ['type', 'nestedBlocks'])
) {
  //@Field(() => [BlockType], { nullable: 'items' })
  //nestedBlocks!: Array<BlockType | null>;
  @Field(() => [NestedBlockInput])
  nestedBlocks!: NestedBlockInput[];

  @Field(() => BlockType)
  type!: typeof BlockType.FlexBlock;
}
