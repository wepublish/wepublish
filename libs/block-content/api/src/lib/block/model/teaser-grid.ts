import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Teaser, TeaserInput} from './teaser'
import {BlockType} from '../block.model'

@ObjectType()
export class TeaserGridBlock {
  @Field()
  type = BlockType.TeaserGrid

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => [Teaser])
  teasers!: (typeof Teaser)[]

  @Field(() => Number)
  numColumns!: number
}

@InputType()
export class TeaserGridBlockInput extends OmitType(TeaserGridBlock, ['teasers']) {
  @Field(() => [TeaserInput])
  teasers!: TeaserInput[]
}
