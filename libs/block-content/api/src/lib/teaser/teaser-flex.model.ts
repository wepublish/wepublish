import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Teaser, TeaserInput } from './teaser.model';
import {
  FlexAlignment,
  FlexAlignmentInput,
} from '../flex/flex-alignment.model';

@ObjectType()
export class FlexTeaser {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment;

  @Field(() => Teaser, { nullable: true })
  teaser?: typeof Teaser | null;
}

@InputType()
export class FlexTeaserInput extends OmitType(
  FlexTeaser,
  ['teaser', 'alignment'] as const,
  InputType
) {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput;

  @Field(() => TeaserInput, { nullable: true })
  teaser?: TeaserInput | null;
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
