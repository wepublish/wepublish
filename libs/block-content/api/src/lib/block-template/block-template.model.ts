import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import type {
  BlockContent,
  BlockContentInput,
  HasBlockContent,
} from '../block-content.model';

@ObjectType({
  implements: () => [require('../block-content.model').HasBlockContent],
})
export class BlockTemplate implements HasBlockContent {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  blocks!: Array<typeof BlockContent>;
}

@ArgsType()
export class CreateBlockTemplateInput extends PickType(
  BlockTemplate,
  ['name'] as const,
  ArgsType
) {
  @Field(() => [require('../block-content.model').BlockContentInput])
  blocks!: BlockContentInput[];
}

@ArgsType()
export class UpdateBlockTemplateInput extends CreateBlockTemplateInput {
  @Field()
  id!: string;
}

@ObjectType({
  implements: [BaseBlock],
})
export class BlockTemplateBlock extends BaseBlock<
  typeof BlockType.BlockTemplate
> {
  @Field()
  templateID!: string;

  @Field(() => BlockTemplate, { nullable: true })
  template?: BlockTemplate;
}

@InputType()
export class BlockTemplateBlockInput extends OmitType(
  BlockTemplateBlock,
  ['template', 'type'] as const,
  InputType
) {}

export function isBlockTemplateBlock(
  block: BaseBlock<BlockType>
): block is BlockTemplateBlock {
  return block.type === BlockType.BlockTemplate;
}
