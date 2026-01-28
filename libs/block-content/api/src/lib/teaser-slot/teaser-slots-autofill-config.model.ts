import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { TeaserType } from '../teaser/teaser.model';
import {
  TeaserListBlockFilter,
  TeaserListBlockFilterInput,
  TeaserListBlockSort,
} from '../teaser/teaser-list.model';

@ObjectType({
  implements: () => [BaseBlock],
})
export class TeaserSlotsAutofillConfig {
  @Field(() => Boolean)
  enabled!: boolean;
  @Field(() => TeaserType, { nullable: true })
  teaserType?: TeaserType;
  @Field(() => TeaserListBlockSort, { nullable: true })
  sort?: TeaserListBlockSort;
  @Field(() => TeaserListBlockFilter, { nullable: true })
  filter?: TeaserListBlockFilter;
}

@InputType()
export class TeaserSlotsAutofillConfigInput extends OmitType(
  TeaserSlotsAutofillConfig,
  ['filter'] as const,
  InputType
) {
  @Field(() => TeaserListBlockFilterInput, { nullable: true })
  filter?: TeaserListBlockFilterInput;
}
