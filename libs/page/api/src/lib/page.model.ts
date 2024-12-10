import {
  ArgsType,
  Directive,
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {Tag} from '@wepublish/tag/api'
import {DateFilter, PaginatedType, Property, PropertyInput, SortOrder} from '@wepublish/utils/api'
import {BlockContent, BlockContentInput, HasBlockContent} from '@wepublish/block-content/api'

export enum PageSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  PublishedAt = 'PublishedAt'
}

registerEnumType(SortOrder, {
  name: 'SortOrder'
})

registerEnumType(PageSort, {
  name: 'PageSort'
})

@ObjectType({
  implements: () => [HasBlockContent]
})
@Directive('@key(fields: "id")')
export class PageRevision implements HasBlockContent {
  blocks!: Array<typeof BlockContent>

  @Field()
  id!: string
  @Field()
  createdAt!: Date

  @Field()
  publishedAt!: Date

  @Field({nullable: true})
  title?: string
  @Field({nullable: true})
  description?: string

  @Field({nullable: true})
  imageID?: string
  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => [Property])
  properties!: Property[]

  @Field({nullable: true})
  socialMediaTitle?: string
  @Field({nullable: true})
  socialMediaDescription?: string
  @Field({nullable: true})
  socialMediaImageID?: string
  @Field(() => Image, {nullable: true})
  socialMediaImage?: Image
}

@ObjectType()
@Directive('@key(fields: "id")')
export class Page {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field({nullable: true})
  slug?: string

  @Field()
  publishedAt!: Date

  @Field()
  url!: string

  @Field(() => PageRevision, {nullable: true})
  draft?: PageRevision

  @Field(() => PageRevision, {nullable: true})
  pending?: PageRevision

  @Field(() => PageRevision, {nullable: true})
  published?: PageRevision

  @Field(() => [Tag])
  tags!: Tag[]
}

@ObjectType()
export class PaginatedPages extends PaginatedType(Page) {}

@ArgsType()
export class CreatePageInput extends OmitType(
  PageRevision,
  ['id', 'createdAt', 'publishedAt', 'image', 'socialMediaImage', 'blocks', 'properties'] as const,
  ArgsType
) {
  @Field({nullable: true})
  slug?: string

  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[]

  @Field(() => [String])
  tagIds!: string[]

  @Field(() => [PropertyInput])
  properties!: PropertyInput[]
}

@ArgsType()
export class UpdatePageInput extends CreatePageInput {
  @Field()
  id!: string
}

@InputType()
export class PageFilter {
  @Field({nullable: true})
  title?: string
  @Field({nullable: true})
  description?: string

  @Field({nullable: true})
  publicationDateFrom?: DateFilter
  @Field({nullable: true})
  publicationDateTo?: DateFilter

  @Field({nullable: true})
  draft?: boolean
  @Field({nullable: true})
  published?: boolean
  @Field({nullable: true})
  pending?: boolean

  @Field(() => [String], {nullable: true})
  tags?: string[]
}

@ArgsType()
export class PageListArgs {
  @Field(() => PageFilter, {nullable: true})
  filter?: PageFilter

  @Field(() => PageSort, {nullable: true, defaultValue: PageSort.PublishedAt})
  sort?: PageSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Ascending})
  order?: SortOrder

  @Field(() => Int, {nullable: true, defaultValue: 10})
  take?: number

  @Field(() => Int, {nullable: true, defaultValue: 0})
  skip?: number

  @Field({nullable: true})
  cursorId?: string
}
