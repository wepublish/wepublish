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

@ObjectType()
export class NestedBlock {
  @Field(() => FlexAlignmentBlocks)
  alignment!: FlexAlignmentBlocks;

  @Field(() => BaseBlock, { nullable: true })
  block?: BaseBlock<BlockType> | null;
}

@InputType()
export class NestedBlockInput extends OmitType(
  NestedBlock,
  ['block', 'alignment'] as const,
  InputType
) {
  @Field(() => FlexAlignmentBlocksInput)
  alignment!: FlexAlignmentBlocksInput;

  @Field(() => BlockType, { nullable: true })
  block?: BlockType | null;
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
