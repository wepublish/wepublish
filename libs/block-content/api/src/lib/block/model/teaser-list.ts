import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Teaser, TeaserType, TeaserUnion} from './teaser'
import {BlockType} from '../block-type'

@ObjectType()
export class TeaserListBlockFilter {
  @Field(() => [ID], {nullable: true})
  tags?: string[]
}

@ObjectType()
export class TeaserListBlock {
  @Field()
  type: BlockType = BlockType.TeaserList

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

  @Field(() => [TeaserUnion])
  teasers!: Teaser[]
}

@InputType()
export class TeaserListBlockFilterInput extends OmitType(TeaserListBlockFilter, [], InputType) {}

@InputType()
export class TeaserListBlockInput extends OmitType(TeaserListBlock, ['teasers', 'filter']) {
  @Field(() => TeaserListBlockFilterInput)
  filter?: TeaserListBlockFilterInput
}
