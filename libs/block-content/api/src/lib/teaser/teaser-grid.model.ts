import {Field, Int, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Teaser} from './teaser.model'

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserGridBlock extends BaseBlock<BlockType.TeaserGrid> {
  @Field(() => Int)
  numColumns!: number

  @Field(() => [Teaser])
  teasers!: Array<typeof Teaser>
}
