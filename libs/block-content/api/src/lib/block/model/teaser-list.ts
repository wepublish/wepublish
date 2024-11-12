import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Teaser, TeaserType} from './teaser'

@ObjectType()
export class TeaserListBlockFilter {
  @Field(() => [ID], {nullable: true})
  tags?: string[]
}

@ObjectType()
export class TeaserListBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field()
  teaserType!: TeaserType

  @Field()
  filter!: TeaserListBlockFilter

  @Field()
  take!: number

  @Field()
  skip!: number

  @Field(() => [Teaser])
  teasers!: (typeof Teaser)[]
}

@InputType()
export class TeaserListBlockFilterInput extends TeaserListBlockFilter {}

@InputType()
export class TeaserListBlockInput extends OmitType(TeaserListBlock, ['teasers', 'filter']) {
  @Field(() => TeaserListBlockFilterInput)
  filter?: TeaserListBlockFilterInput
}
