import {
  ArgsType,
  Directive,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {Author} from '@wepublish/author/api'
import {Tag} from '@wepublish/tag/api'
import {DateFilter, PaginatedType, Property, PropertyInput, SortOrder} from '@wepublish/utils/api'
import {BlockContent, BlockContentInput, HasBlockContent} from '@wepublish/block-content/api'
import {Peer} from '@wepublish/peering/api'

export enum ArticleSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  PublishedAt = 'PublishedAt'
}

registerEnumType(SortOrder, {
  name: 'SortOrder'
})

registerEnumType(ArticleSort, {
  name: 'ArticleSort'
})

@ObjectType({
  implements: () => [HasBlockContent]
})
@Directive('@key(fields: "id")')
export class ArticleRevision implements HasBlockContent {
  blocks!: Array<typeof BlockContent>

  @Field()
  id!: string
  @Field()
  createdAt!: Date

  @Field()
  publishedAt!: Date

  @Field({nullable: true})
  preTitle?: string
  @Field({nullable: true})
  title?: string
  @Field({nullable: true})
  lead?: string

  @Field({nullable: true})
  imageID?: string
  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => [Author])
  authors!: Author[]

  @Field()
  canonicalUrl!: string

  @Field()
  hideAuthor!: boolean

  @Field()
  breaking!: boolean
  @Field(() => [Property])
  properties!: Property[]

  @Field({nullable: true})
  seoTitle?: string
  @Field({nullable: true})
  socialMediaTitle?: string
  @Field({nullable: true})
  socialMediaDescription?: string
  @Field(() => [Author])
  socialMediaAuthors!: Author[]
  @Field({nullable: true})
  socialMediaImageID?: string
  @Field(() => Image, {nullable: true})
  socialMediaImage?: Image
}

@ObjectType()
@Directive('@key(fields: "id")')
export class Article {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field({nullable: true})
  slug?: string

  @Field()
  url!: string

  @Field()
  publishedAt!: Date

  @Field()
  shared!: boolean

  @Field()
  hidden!: boolean

  @Field()
  disableComments!: boolean

  @Field(() => ArticleRevision, {nullable: true})
  draft?: ArticleRevision

  @Field(() => ArticleRevision, {nullable: true})
  pending?: ArticleRevision

  @Field(() => ArticleRevision, {nullable: true})
  published?: ArticleRevision

  @Field(() => ArticleRevision)
  latest!: ArticleRevision

  @Field(() => [Tag])
  tags!: Tag[]

  @Field({nullable: true})
  peerId?: string
  @Field({nullable: true})
  peer?: Peer
  @Field({nullable: true})
  peerArticleId?: string
}

@ObjectType()
export class PaginatedArticles extends PaginatedType(Article) {}

@ArgsType()
export class CreateArticleInput extends OmitType(
  ArticleRevision,
  [
    'id',
    'createdAt',
    'publishedAt',
    'image',
    'socialMediaImage',
    'authors',
    'socialMediaAuthors',
    'blocks',
    'properties'
  ] as const,
  ArgsType
) {
  @Field()
  shared!: boolean
  @Field()
  hidden!: boolean
  @Field()
  disableComments!: boolean
  @Field({nullable: true})
  slug?: string

  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[]

  @Field(() => [String])
  tagIds!: string[]

  @Field(() => [String])
  authorIds!: string[]

  @Field(() => [String])
  socialMediaAuthorIds!: string[]

  @Field(() => [PropertyInput])
  properties!: PropertyInput[]
}

@ArgsType()
export class UpdateArticleInput extends CreateArticleInput {
  @Field()
  id!: string
}

@InputType()
export class ArticleFilter {
  @Field({nullable: true})
  title?: string
  @Field({nullable: true})
  preTitle?: string
  @Field({nullable: true})
  lead?: string

  @Field({nullable: true})
  shared?: boolean
  @Field({nullable: true})
  includeHidden?: boolean

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
  authors?: string[]
  @Field(() => [String], {nullable: true})
  tags?: string[]
}

@ArgsType()
export class ArticleListArgs {
  @Field(() => ArticleFilter, {nullable: true})
  filter?: ArticleFilter

  @Field(() => ArticleSort, {nullable: true, defaultValue: ArticleSort.PublishedAt})
  sort?: ArticleSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Ascending})
  order?: SortOrder

  @Field(() => Int, {nullable: true, defaultValue: 10})
  take?: number

  @Field(() => Int, {nullable: true, defaultValue: 0})
  skip?: number

  @Field({nullable: true})
  cursorId?: string
}
