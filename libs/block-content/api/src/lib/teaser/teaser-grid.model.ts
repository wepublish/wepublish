import {Field, InputType, Int, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Teaser, TeaserInput} from './teaser.model'

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserGridBlock extends BaseBlock<BlockType.TeaserGrid> {
  @Field(() => Int)
  numColumns!: number

  @Field(() => [Teaser])
  teasers!: Array<typeof Teaser>
}

@InputType()
export class TeaserGridBlockInput extends OmitType(
  TeaserGridBlock,
  ['teasers'] as const,
  InputType
) {
  @Field(() => [TeaserInput])
  teasers!: TeaserInput[]
}
