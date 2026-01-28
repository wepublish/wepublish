import { Field, InputType, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Teaser, TeaserInput } from './teaser.model';

@ObjectType({
  implements: () => [BaseBlock],
})
export class TeaserGridBlock extends BaseBlock<BlockType.TeaserGrid> {
  @Field(() => Int)
  numColumns!: number;

  @Field(() => [Teaser], { nullable: 'items' })
  teasers!: Array<typeof Teaser | null>;
}

@InputType()
export class TeaserGridBlockInput extends OmitType(
  TeaserGridBlock,
  ['teasers', 'type'] as const,
  InputType
) {
  @Field(() => [TeaserInput], { nullable: 'items' })
  teasers!: Array<TeaserInput | null>;
}

export function isTeaserGridBlock(
  block: BaseBlock<BlockType>
): block is TeaserGridBlock {
  return block.type === BlockType.TeaserGrid;
}
