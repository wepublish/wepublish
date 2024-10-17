import {Field, Int, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Teaser} from './teaser.model'

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

@ObjectType()
export class FlexTeaser {
  @Field(() => FlexAlignment)
  alignment!: FlexAlignment

  @Field(() => Teaser)
  teaser!: typeof Teaser
}

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserGridFlexBlock extends BaseBlock<BlockType.TeaserGridFlex> {
  @Field(() => [FlexTeaser])
  flexTeasers!: FlexTeaser[]
}
