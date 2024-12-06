import {Field, InputType, Int, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Teaser, TeaserInput} from './teaser.model'

@ObjectType()
export class FlexAlignment {
  @Field(() => Int)
  i!: number

  @Field(() => Int)
  x!: number
  @Field(() => Int)
  y!: number

  @Field(() => Int)
  w!: number
  @Field(() => Int)
  h!: number

  @Field()
  static!: boolean
}

@InputType()
export class FlexAlignmentInput extends OmitType(FlexAlignment, [] as const, InputType) {}

@ObjectType()
export class FlexTeaser {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment

  @Field(() => Teaser)
  teaser!: typeof Teaser
}

@InputType()
export class FlexTeaserInput extends OmitType(
  FlexTeaser,
  ['teaser', 'alignment'] as const,
  InputType
) {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput

  @Field(() => TeaserInput)
  teaser!: TeaserInput
}

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserGridFlexBlock extends BaseBlock<BlockType.TeaserGridFlex> {
  @Field(() => [FlexTeaser])
  flexTeasers!: FlexTeaser[]
}

@InputType()
export class TeaserGridFlexBlockInput extends OmitType(
  TeaserGridFlexBlock,
  ['flexTeasers'] as const,
  InputType
) {
  @Field(() => [FlexTeaserInput])
  flexTeasers!: FlexTeaserInput[]
}