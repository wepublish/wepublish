import {Field, ID, InputType, Int, ObjectType, OmitType, registerEnumType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Teaser, TeaserType} from './teaser.model'
import {Tag} from '@wepublish/tag/api'

export enum TeaserListBlockSort {
  PublishedAt = 'publishedAt',
  HotAndTrending = 'hotAndTrending'
}

registerEnumType(TeaserListBlockSort, {
  name: 'TeaserListBlockSort'
})

@ObjectType()
export class TeaserListBlockFilter {
  @Field(() => [ID])
  tags!: string[]

  @Field(() => [Tag])
  tagObjects!: Tag[]
}

@InputType()
export class TeaserListBlockFilterInput extends OmitType(
  TeaserListBlockFilter,
  ['tagObjects'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserListBlock extends BaseBlock<BlockType.TeaserList> {
  @Field({nullable: true})
  title?: string

  @Field(() => TeaserType)
  teaserType!: TeaserType
  @Field(() => Int, {nullable: true})
  take?: number
  @Field(() => Int, {nullable: true})
  skip?: number
  @Field(() => TeaserListBlockSort, {nullable: true})
  sort?: TeaserListBlockSort
  @Field(() => TeaserListBlockFilter)
  filter!: TeaserListBlockFilter

  @Field(() => [Teaser])
  teasers!: Array<typeof Teaser>
}

@InputType()
export class TeaserListBlockInput extends OmitType(
  TeaserListBlock,
  ['teasers', 'filter'] as const,
  InputType
) {
  @Field(() => TeaserListBlockFilterInput)
  filter!: TeaserListBlockFilterInput
}
