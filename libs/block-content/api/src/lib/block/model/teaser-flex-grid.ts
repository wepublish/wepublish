import {Field, InputType, ObjectType, OmitType, Int} from '@nestjs/graphql'
import {Teaser, TeaserInput} from './teaser'

// Objects

@ObjectType()
export class FlexAlignment {
  @Field(() => String)
  i!: string

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

@ObjectType()
export class FlexTeaser {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment

  @Field(() => Teaser)
  teaser!: typeof Teaser
}

@ObjectType()
export class TeaserGridFlexBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [FlexTeaser])
  flexTeasers!: FlexTeaser[]
}

// Inputs

@InputType()
export class FlexAlignmentInput extends FlexAlignment {}

@InputType()
export class FlexTeaserInput {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput

  @Field(() => TeaserInput)
  teaser!: TeaserInput
}

@InputType()
export class TeaserGridFlexBlockInput extends OmitType(TeaserGridFlexBlock, ['flexTeasers']) {
  @Field(() => [FlexTeaserInput])
  flexTeasers!: FlexTeaserInput[]
}
