import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: [BaseBlock],
})
export class FlexBlock extends BaseBlock<typeof BlockType.FlexBlock> {
  @Field(() => [BlockType], { nullable: true })
  nestedBlocks!: Array<BlockType | null>;
}

@InputType()
export class FlexBlockInput extends PartialType(
  OmitType(FlexBlock, ['type', 'nestedBlocks'])
) {
  @Field(() => [BlockType], { nullable: true })
  nestedBlocks!: Array<BlockType | null>;

  @Field(() => BlockType)
  type!: typeof BlockType.FlexBlock;
}
