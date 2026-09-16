import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
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

  @Field(() => [BlockContent])
  blocks!: BlockContent[];
}

@InputType()
export class BlockTemplateFilter {
  @Field({ nullable: true })
  name?: string;
}

export enum BlockTemplateSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

registerEnumType(BlockTemplateSort, {
  name: 'BlockTemplateSort',
});

@ObjectType()
export class PaginatedBlockTemplate extends PaginatedType(BlockTemplate) {}

@ArgsType()
export class BlockTemplateListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => BlockTemplateFilter, {
    nullable: true,
    description: 'Filter for block templates',
  })
  filter?: BlockTemplateFilter;

  @Field(() => BlockTemplateSort, {
    defaultValue: BlockTemplateSort.Name,
    description: 'Field to sort by',
  })
  sort?: BlockTemplateSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Ascending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
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
