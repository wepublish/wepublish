import {Field, InputType, ObjectType} from '@nestjs/graphql'
import {Teaser, TeaserInput} from './teaser'

@ObjectType()
export class TeaserGridBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [Teaser])
  teasers!: (typeof Teaser)[]

  @Field(() => Number)
  numColumns!: number
}

@InputType()
export class TeaserGridBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [TeaserInput])
  teasers!: TeaserInput[]

  @Field(() => Number)
  numColumns!: number
}
