/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * `block-content.model` is required lazily on purpose. A static
 * `import` of it here would close the import cycle between the two modules,
 * which makes webpack initialize `block-content.model` first. Its
 * `emitDecoratorMetadata` output then reads `FlexBlockInput` eagerly while this
 * module is still in its temporal dead zone, throwing
 * "Cannot access 'FlexBlockInput' before initialization" at boot.
 */

import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import type {
  BlockContentInput,
  BlockContent,
  HasOneBlockContent,
} from '../block-content.model';
import { FlexAlignment, FlexAlignmentInput } from './flex-alignment.model';

@ObjectType({
  implements: () => [require('../block-content.model').HasOneBlockContent],
})
export class BlockWithAlignment implements HasOneBlockContent {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment;

  block?: typeof BlockContent;
}

@InputType()
export class BlockWithAlignmentInput extends OmitType(
  BlockWithAlignment,
  ['block', 'alignment'] as const,
  InputType
) {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput;

  @Field(() => require('../block-content.model').BlockContentInput, {
    nullable: true,
  })
  block?: BlockContentInput;
}

@ObjectType({
  implements: [BaseBlock],
})
export class FlexBlock extends BaseBlock<typeof BlockType.FlexBlock> {
  @Field(() => [BlockWithAlignment])
  blocks!: BlockWithAlignment[];
}

@InputType()
export class FlexBlockInput extends OmitType(
  FlexBlock,
  ['blocks', 'type'] as const,
  InputType
) {
  @Field(() => [BlockWithAlignmentInput])
  blocks!: BlockWithAlignmentInput[];
}

export function isFlexBlock(block: BaseBlock<BlockType>): block is FlexBlock {
  return block.type === BlockType.FlexBlock;
}
