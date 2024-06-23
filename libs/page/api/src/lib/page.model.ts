import {
  ObjectType,
  Field,
  ID,
  InputType,
  ArgsType,
  Int,
  registerEnumType,
  PickType
} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {Block, BlockInput, BlockUnion} from '@wepublish/block-content/api'
import {DateFilter, PaginatedArgsType, PaginatedType, SortOrder} from '@wepublish/utils/api'
import {Property, PropertyInput} from '@wepublish/property/api'

export enum PageSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  PublishedAt = 'publishedAt',
  UpdatedAt = 'updatedAt',
  PublishAt = 'publishAt'
}

registerEnumType(PageSort, {name: 'PageSort'})

@ObjectType()
class PageData {
  @Field(() => Date, {nullable: true})
  updatedAt?: Date

  @Field(() => Date, {nullable: true})
  publishedAt?: Date

  @Field(() => String, {nullable: true})
  slug?: string

  @Field(() => String)
  title!: string

  @Field(() => String, {nullable: true})
  description?: string

  @Field(() => [String])
  tags!: string[]

  @Field(() => [Property])
  properties!: Property[]

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  socialMediaTitle?: string

  @Field(() => String, {nullable: true})
  socialMediaDescription?: string

  @Field(() => ID, {nullable: true})
  socialMediaImageID?: string

  @Field(() => Image, {nullable: true})
  socialMediaImage?: Image

  @Field(() => [BlockUnion])
  blocks!: Block[]
}

// Object Types
@ObjectType()
export class PageRevision extends PageData {
  @Field(() => Int)
  revision!: number

  @Field(() => Date, {nullable: true})
  publishAt?: Date

  @Field(() => Date)
  createdAt!: Date
}

@ObjectType()
export class Page {
  @Field(() => ID)
  id!: string

  @Field(() => Boolean)
  shared!: boolean

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field(() => PageRevision, {nullable: true})
  draft?: PageRevision

  @Field(() => PageRevision, {nullable: true})
  published?: PageRevision

  @Field(() => PageRevision, {nullable: true})
  pending?: PageRevision

  @Field(() => PageRevision)
  latest!: PageRevision
}

@ObjectType()
export class PaginatedPages extends PaginatedType(Page) {}

@ObjectType()
export class PublishedPage extends PageData {
  @Field(() => ID)
  id!: string
}

@ObjectType()
export class PaginatedPublishedPages extends PaginatedType(PublishedPage) {}

// Input Types
@InputType()
export class PageFilter {
  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => Boolean, {nullable: true})
  draft?: boolean

  @Field(() => String, {nullable: true})
  description?: string

  @Field(() => DateFilter, {nullable: true})
  publicationDateFrom?: DateFilter

  @Field(() => DateFilter, {nullable: true})
  publicationDateTo?: DateFilter

  @Field(() => Boolean, {nullable: true})
  published?: boolean

  @Field(() => Boolean, {nullable: true})
  pending?: boolean

  @Field(() => [String], {nullable: true})
  tags?: string[]
}

@InputType()
export class PublishedPageFilter extends PickType(PageFilter, ['tags']) {}

@InputType()
export class PageInput extends PickType(
  PageData,
  [
    'slug',
    'title',
    'description',
    'tags',
    'socialMediaDescription',
    'socialMediaTitle',
    'socialMediaImageID'
  ],
  InputType
) {
  @Field(() => [BlockInput])
  blocks!: BlockInput[]

  @Field(() => [PropertyInput])
  properties!: PropertyInput[]
}

// Args Types
@ArgsType()
export class GetPageArgs {
  @Field(() => ID)
  id!: string
}

@ArgsType()
export class GetPagesArgs extends PaginatedArgsType {
  @Field(() => PageFilter, {nullable: true})
  filter?: Partial<PageFilter>

  @Field(() => PageSort, {nullable: true})
  sortedField?: PageSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Ascending})
  order?: SortOrder
}

@ArgsType()
export class GetPublishedPagesArgs extends PaginatedArgsType {
  @Field(() => PageFilter, {nullable: true})
  filter?: PublishedPageFilter

  @Field(() => PageSort, {nullable: true})
  sortedField?: PageSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Ascending})
  order?: SortOrder
}

@ArgsType()
export class CreatePageArgs {
  @Field(() => PageInput)
  page!: PageInput
}

@ArgsType()
export class UpdatePageArgs {
  @Field(() => ID)
  id!: string

  @Field(() => PageInput)
  page!: PageInput
}

@InputType()
export class PublishPageInput extends PickType(
  PageRevision,
  ['publishAt', 'publishedAt', 'updatedAt'],
  InputType
) {}

@ArgsType()
export class PublishPageArgs {
  @Field(() => ID)
  id!: string

  @Field(() => PublishPageInput)
  input!: PublishPageInput
}

@ArgsType()
export class DeletePageArgs {
  @Field(() => ID)
  id!: string
}
