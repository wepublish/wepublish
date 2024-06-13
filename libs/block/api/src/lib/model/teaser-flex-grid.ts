import {Field, InputType, ObjectType} from '@nestjs/graphql'
import {GraphQLBoolean, GraphQLInt} from 'graphql/index'
import {Teaser, TeaserInput} from './teaser'

// Objects

@ObjectType()
export class FlexAlignment {
  @Field(() => String)
  i!: string

  @Field(() => GraphQLInt)
  x!: number

  @Field(() => GraphQLInt)
  y!: number

  @Field(() => GraphQLInt)
  w!: number

  @Field(() => GraphQLInt)
  h!: number

  @Field(() => GraphQLBoolean)
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
export class FlexAlignmentInput {
  @Field(() => String)
  i!: string

  @Field(() => GraphQLInt)
  x!: number

  @Field(() => GraphQLInt)
  y!: number

  @Field(() => GraphQLInt)
  w!: number

  @Field(() => GraphQLInt)
  h!: number

  @Field(() => GraphQLBoolean)
  static!: boolean
}

@InputType()
export class FlexTeaserInput {
  @Field(() => FlexAlignmentInput)
  alignment!: FlexAlignmentInput

  @Field(() => TeaserInput)
  teaser!: TeaserInput
}

@InputType()
export class TeaserGridFlexBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [FlexTeaserInput])
  flexTeasers!: FlexTeaserInput[]
}
