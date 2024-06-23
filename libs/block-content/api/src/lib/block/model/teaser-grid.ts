import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Teaser, TeaserInput, TeaserUnion} from './teaser'
import {BlockType} from '../block-type'

@ObjectType()
export class TeaserGridBlock {
  @Field()
  type: BlockType = BlockType.TeaserGrid

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [TeaserUnion])
  teasers!: Teaser[]

  @Field(() => Number)
  numColumns!: number
}

@InputType()
export class TeaserGridBlockInput extends OmitType(TeaserGridBlock, ['teasers']) {
  @Field(() => [TeaserInput])
  teasers!: TeaserInput[]
}
