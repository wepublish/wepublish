import type {MetadataProperty} from '@prisma/client'
import type {ArticleRevision} from '@prisma/client'
import type {ArticleRevisionAuthor} from '@prisma/client'
import type {ArticleRevisionSocialMediaAuthor} from '@prisma/client'
import type {Article} from '@prisma/client'
import type {AuthorsLinks} from '@prisma/client'
import type {Author} from '@prisma/client'
import type {FocalPoint} from '@prisma/client'
import type {Image} from '@prisma/client'
import type {CommentsRevisions} from '@prisma/client'
import type {Comment} from '@prisma/client'
import type {TaggedComments} from '@prisma/client'
import type {CommentRatingSystem} from '@prisma/client'
import type {CommentRatingSystemAnswer} from '@prisma/client'
import type {CommentRating} from '@prisma/client'
import type {CommentRatingOverride} from '@prisma/client'
import type {InvoiceItem} from '@prisma/client'
import type {Invoice} from '@prisma/client'
import type {MailLog} from '@prisma/client'
import type {AvailablePaymentMethod} from '@prisma/client'
import type {MemberPlan} from '@prisma/client'
import type {NavigationLink} from '@prisma/client'
import type {Navigation} from '@prisma/client'
import type {PageRevision} from '@prisma/client'
import type {Page} from '@prisma/client'
import type {PaymentMethod} from '@prisma/client'
import type {Payment} from '@prisma/client'
import type {PeerProfile} from '@prisma/client'
import type {Peer} from '@prisma/client'
import type {Token} from '@prisma/client'
import type {Session} from '@prisma/client'
import type {SubscriptionPeriod} from '@prisma/client'
import type {SubscriptionDeactivation} from '@prisma/client'
import type {Subscription} from '@prisma/client'
import type {UserAddress} from '@prisma/client'
import type {UserOAuth2Account} from '@prisma/client'
import type {PaymentProviderCustomer} from '@prisma/client'
import type {User} from '@prisma/client'
import type {UserRole} from '@prisma/client'
import type {Setting} from '@prisma/client'
import type {Tag} from '@prisma/client'
import type {Poll} from '@prisma/client'
import type {PollAnswer} from '@prisma/client'
import type {PollVote} from '@prisma/client'
import type {PollExternalVoteSource} from '@prisma/client'
import type {PollExternalVote} from '@prisma/client'
import type {Event} from '@prisma/client'
import type {TaggedEvents} from '@prisma/client'
import type {UserFlowMail} from '@prisma/client'
import type {SubscriptionFlow} from '@prisma/client'
import type {SubscriptionInterval} from '@prisma/client'
import type {MailTemplate} from '@prisma/client'
import type {PeriodicJob} from '@prisma/client'
import type {CommentItemType} from '@prisma/client'
import type {CommentRejectionReason} from '@prisma/client'
import type {CommentState} from '@prisma/client'
import type {CommentAuthorType} from '@prisma/client'
import type {RatingSystemType} from '@prisma/client'
import type {MailLogState} from '@prisma/client'
import type {PaymentPeriodicity} from '@prisma/client'
import type {PaymentState} from '@prisma/client'
import type {SubscriptionDeactivationReason} from '@prisma/client'
import type {TagType} from '@prisma/client'
import type {EventStatus} from '@prisma/client'
import type {UserEvent} from '@prisma/client'
import type {SubscriptionEvent} from '@prisma/client'
import {Prisma} from '@prisma/client'
import {Resolver} from '@quramy/prisma-fabbrica/lib/internal'
export {
  initialize,
  resetSequence,
  registerScalarFieldValueGenerator,
  resetScalarFieldValueGenerator
} from '@quramy/prisma-fabbrica/lib/internal'
declare type BuildDataOptions = {
  readonly seq: number
}
declare type MetadataPropertyArticleRevisionFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutPropertiesInput['create']>
}
declare type MetadataPropertyPageRevisionFactory = {
  _factoryFor: 'PageRevision'
  build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPropertiesInput['create']>
}
declare type MetadataPropertySubscriptionFactory = {
  _factoryFor: 'Subscription'
  build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutPropertiesInput['create']>
}
declare type MetadataPropertyUserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPropertiesInput['create']>
}
declare type MetadataPropertyFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  key?: string
  value?: string
  public?: boolean
  ArticleRevision?:
    | MetadataPropertyArticleRevisionFactory
    | Prisma.ArticleRevisionCreateNestedOneWithoutPropertiesInput
  PageRevision?:
    | MetadataPropertyPageRevisionFactory
    | Prisma.PageRevisionCreateNestedOneWithoutPropertiesInput
  Subscription?:
    | MetadataPropertySubscriptionFactory
    | Prisma.SubscriptionCreateNestedOneWithoutPropertiesInput
  User?: MetadataPropertyUserFactory | Prisma.UserCreateNestedOneWithoutPropertiesInput
}
declare type MetadataPropertyFactoryDefineOptions = {
  defaultData?: Resolver<MetadataPropertyFactoryDefineInput, BuildDataOptions>
}
export interface MetadataPropertyFactoryInterface {
  readonly _factoryFor: 'MetadataProperty'
  build(
    inputData?: Partial<Prisma.MetadataPropertyCreateInput>
  ): PromiseLike<Prisma.MetadataPropertyCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.MetadataPropertyCreateInput>
  ): PromiseLike<Prisma.MetadataPropertyCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]
  ): PromiseLike<Prisma.MetadataPropertyCreateInput[]>
  pickForConnect(inputData: MetadataProperty): Pick<MetadataProperty, 'id'>
  create(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<MetadataProperty>
  createList(
    inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]
  ): PromiseLike<MetadataProperty[]>
  createForConnect(
    inputData?: Partial<Prisma.MetadataPropertyCreateInput>
  ): PromiseLike<Pick<MetadataProperty, 'id'>>
}
/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
export declare function defineMetadataPropertyFactory(
  options?: MetadataPropertyFactoryDefineOptions
): MetadataPropertyFactoryInterface
declare type ArticleRevisionimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput['create']>
}
declare type ArticleRevisionsocialMediaImageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<
    Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput['create']
  >
}
declare type ArticleRevisionFactoryDefineInput = {
  id?: string
  preTitle?: string | null
  title?: string | null
  lead?: string | null
  seoTitle?: string | null
  slug?: string | null
  tags?: Prisma.ArticleRevisionCreatetagsInput | Prisma.Enumerable<string>
  canonicalUrl?: string | null
  properties?: Prisma.MetadataPropertyCreateNestedManyWithoutArticleRevisionInput
  image?: ArticleRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput
  authors?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutRevisionInput
  breaking?: boolean
  blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  hideAuthor?: boolean
  socialMediaTitle?: string | null
  socialMediaDescription?: string | null
  socialMediaAuthors?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutRevisionInput
  socialMediaImage?:
    | ArticleRevisionsocialMediaImageFactory
    | Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput
  revision?: number
  createdAt?: Date
  modifiedAt?: Date | null
  updatedAt?: Date | null
  publishAt?: Date | null
  publishedAt?: Date | null
  PublishedArticle?: Prisma.ArticleCreateNestedManyWithoutPublishedInput
  PendingArticle?: Prisma.ArticleCreateNestedManyWithoutPendingInput
  DraftArticle?: Prisma.ArticleCreateNestedManyWithoutDraftInput
}
declare type ArticleRevisionFactoryDefineOptions = {
  defaultData?: Resolver<ArticleRevisionFactoryDefineInput, BuildDataOptions>
}
export interface ArticleRevisionFactoryInterface {
  readonly _factoryFor: 'ArticleRevision'
  build(
    inputData?: Partial<Prisma.ArticleRevisionCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.ArticleRevisionCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]
  ): PromiseLike<Prisma.ArticleRevisionCreateInput[]>
  pickForConnect(inputData: ArticleRevision): Pick<ArticleRevision, 'id'>
  create(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<ArticleRevision>
  createList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]
  ): PromiseLike<ArticleRevision[]>
  createForConnect(
    inputData?: Partial<Prisma.ArticleRevisionCreateInput>
  ): PromiseLike<Pick<ArticleRevision, 'id'>>
}
/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
export declare function defineArticleRevisionFactory(
  options?: ArticleRevisionFactoryDefineOptions
): ArticleRevisionFactoryInterface
declare type ArticleRevisionAuthorrevisionFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutAuthorsInput['create']>
}
declare type ArticleRevisionAuthorauthorFactory = {
  _factoryFor: 'Author'
  build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutArticlesAsAuthorInput['create']>
}
declare type ArticleRevisionAuthorFactoryDefineInput = {
  revision:
    | ArticleRevisionAuthorrevisionFactory
    | Prisma.ArticleRevisionCreateNestedOneWithoutAuthorsInput
  author:
    | ArticleRevisionAuthorauthorFactory
    | Prisma.AuthorCreateNestedOneWithoutArticlesAsAuthorInput
}
declare type ArticleRevisionAuthorFactoryDefineOptions = {
  defaultData: Resolver<ArticleRevisionAuthorFactoryDefineInput, BuildDataOptions>
}
export interface ArticleRevisionAuthorFactoryInterface {
  readonly _factoryFor: 'ArticleRevisionAuthor'
  build(
    inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]
  ): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput[]>
  pickForConnect(
    inputData: ArticleRevisionAuthor
  ): Pick<ArticleRevisionAuthor, 'revisionId' | 'authorId'>
  create(
    inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>
  ): PromiseLike<ArticleRevisionAuthor>
  createList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]
  ): PromiseLike<ArticleRevisionAuthor[]>
  createForConnect(
    inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>
  ): PromiseLike<Pick<ArticleRevisionAuthor, 'revisionId' | 'authorId'>>
}
/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
export declare function defineArticleRevisionAuthorFactory(
  options: ArticleRevisionAuthorFactoryDefineOptions
): ArticleRevisionAuthorFactoryInterface
declare type ArticleRevisionSocialMediaAuthorrevisionFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<
    Prisma.ArticleRevisionCreateNestedOneWithoutSocialMediaAuthorsInput['create']
  >
}
declare type ArticleRevisionSocialMediaAuthorauthorFactory = {
  _factoryFor: 'Author'
  build: () => PromiseLike<
    Prisma.AuthorCreateNestedOneWithoutArticlesAsSocialMediaAuthorInput['create']
  >
}
declare type ArticleRevisionSocialMediaAuthorFactoryDefineInput = {
  revision:
    | ArticleRevisionSocialMediaAuthorrevisionFactory
    | Prisma.ArticleRevisionCreateNestedOneWithoutSocialMediaAuthorsInput
  author:
    | ArticleRevisionSocialMediaAuthorauthorFactory
    | Prisma.AuthorCreateNestedOneWithoutArticlesAsSocialMediaAuthorInput
}
declare type ArticleRevisionSocialMediaAuthorFactoryDefineOptions = {
  defaultData: Resolver<ArticleRevisionSocialMediaAuthorFactoryDefineInput, BuildDataOptions>
}
export interface ArticleRevisionSocialMediaAuthorFactoryInterface {
  readonly _factoryFor: 'ArticleRevisionSocialMediaAuthor'
  build(
    inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  ): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]
  ): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput[]>
  pickForConnect(
    inputData: ArticleRevisionSocialMediaAuthor
  ): Pick<ArticleRevisionSocialMediaAuthor, 'revisionId' | 'authorId'>
  create(
    inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  ): PromiseLike<ArticleRevisionSocialMediaAuthor>
  createList(
    inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]
  ): PromiseLike<ArticleRevisionSocialMediaAuthor[]>
  createForConnect(
    inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>
  ): PromiseLike<Pick<ArticleRevisionSocialMediaAuthor, 'revisionId' | 'authorId'>>
}
/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
export declare function defineArticleRevisionSocialMediaAuthorFactory(
  options: ArticleRevisionSocialMediaAuthorFactoryDefineOptions
): ArticleRevisionSocialMediaAuthorFactoryInterface
declare type ArticlepublishedFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<
    Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput['create']
  >
}
declare type ArticlependingFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<
    Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput['create']
  >
}
declare type ArticledraftFactory = {
  _factoryFor: 'ArticleRevision'
  build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput['create']>
}
declare type ArticleFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  published?:
    | ArticlepublishedFactory
    | Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput
  pending?: ArticlependingFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput
  draft?: ArticledraftFactory | Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput
  shared?: boolean
  navigations?: Prisma.NavigationLinkCreateNestedManyWithoutArticleInput
}
declare type ArticleFactoryDefineOptions = {
  defaultData?: Resolver<ArticleFactoryDefineInput, BuildDataOptions>
}
export interface ArticleFactoryInterface {
  readonly _factoryFor: 'Article'
  build(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Prisma.ArticleCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.ArticleCreateInput>
  ): PromiseLike<Prisma.ArticleCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]
  ): PromiseLike<Prisma.ArticleCreateInput[]>
  pickForConnect(inputData: Article): Pick<Article, 'id'>
  create(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Article>
  createList(
    inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]
  ): PromiseLike<Article[]>
  createForConnect(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Pick<Article, 'id'>>
}
/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
export declare function defineArticleFactory(
  options?: ArticleFactoryDefineOptions
): ArticleFactoryInterface
declare type AuthorsLinksAuthorFactory = {
  _factoryFor: 'Author'
  build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutLinksInput['create']>
}
declare type AuthorsLinksFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  title?: string
  url?: string
  Author?: AuthorsLinksAuthorFactory | Prisma.AuthorCreateNestedOneWithoutLinksInput
}
declare type AuthorsLinksFactoryDefineOptions = {
  defaultData?: Resolver<AuthorsLinksFactoryDefineInput, BuildDataOptions>
}
export interface AuthorsLinksFactoryInterface {
  readonly _factoryFor: 'AuthorsLinks'
  build(
    inputData?: Partial<Prisma.AuthorsLinksCreateInput>
  ): PromiseLike<Prisma.AuthorsLinksCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.AuthorsLinksCreateInput>
  ): PromiseLike<Prisma.AuthorsLinksCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]
  ): PromiseLike<Prisma.AuthorsLinksCreateInput[]>
  pickForConnect(inputData: AuthorsLinks): Pick<AuthorsLinks, 'id'>
  create(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<AuthorsLinks>
  createList(
    inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]
  ): PromiseLike<AuthorsLinks[]>
  createForConnect(
    inputData?: Partial<Prisma.AuthorsLinksCreateInput>
  ): PromiseLike<Pick<AuthorsLinks, 'id'>>
}
/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
export declare function defineAuthorsLinksFactory(
  options?: AuthorsLinksFactoryDefineOptions
): AuthorsLinksFactoryInterface
declare type AuthorimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutAuthorInput['create']>
}
declare type AuthorFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  slug?: string
  jobTitle?: string | null
  links?: Prisma.AuthorsLinksCreateNestedManyWithoutAuthorInput
  bio?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  image?: AuthorimageFactory | Prisma.ImageCreateNestedOneWithoutAuthorInput
  articlesAsAuthor?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutAuthorInput
  articlesAsSocialMediaAuthor?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutAuthorInput
}
declare type AuthorFactoryDefineOptions = {
  defaultData?: Resolver<AuthorFactoryDefineInput, BuildDataOptions>
}
export interface AuthorFactoryInterface {
  readonly _factoryFor: 'Author'
  build(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Prisma.AuthorCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.AuthorCreateInput>
  ): PromiseLike<Prisma.AuthorCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]
  ): PromiseLike<Prisma.AuthorCreateInput[]>
  pickForConnect(inputData: Author): Pick<Author, 'id'>
  create(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Author>
  createList(
    inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]
  ): PromiseLike<Author[]>
  createForConnect(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Pick<Author, 'id'>>
}
/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
export declare function defineAuthorFactory(
  options?: AuthorFactoryDefineOptions
): AuthorFactoryInterface
declare type FocalPointimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutFocalPointInput['create']>
}
declare type FocalPointFactoryDefineInput = {
  x?: number | null
  y?: number | null
  image?: FocalPointimageFactory | Prisma.ImageCreateNestedOneWithoutFocalPointInput
}
declare type FocalPointFactoryDefineOptions = {
  defaultData?: Resolver<FocalPointFactoryDefineInput, BuildDataOptions>
}
export interface FocalPointFactoryInterface {
  readonly _factoryFor: 'FocalPoint'
  build(
    inputData?: Partial<Prisma.FocalPointCreateInput>
  ): PromiseLike<Prisma.FocalPointCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.FocalPointCreateInput>
  ): PromiseLike<Prisma.FocalPointCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]
  ): PromiseLike<Prisma.FocalPointCreateInput[]>
  pickForConnect(inputData: FocalPoint): Pick<FocalPoint, 'imageId'>
  create(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<FocalPoint>
  createList(
    inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]
  ): PromiseLike<FocalPoint[]>
  createForConnect(
    inputData?: Partial<Prisma.FocalPointCreateInput>
  ): PromiseLike<Pick<FocalPoint, 'imageId'>>
}
/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
export declare function defineFocalPointFactory(
  options?: FocalPointFactoryDefineOptions
): FocalPointFactoryInterface
declare type ImagefocalPointFactory = {
  _factoryFor: 'FocalPoint'
  build: () => PromiseLike<Prisma.FocalPointCreateNestedOneWithoutImageInput['create']>
}
declare type ImageFactoryDefineInput = {
  id?: string
  createdAt?: Date
  description?: string | null
  extension?: string
  fileSize?: number
  filename?: string | null
  focalPoint?: ImagefocalPointFactory | Prisma.FocalPointCreateNestedOneWithoutImageInput
  format?: string
  license?: string | null
  link?: string | null
  mimeType?: string
  modifiedAt?: Date
  source?: string | null
  tags?: Prisma.ImageCreatetagsInput | Prisma.Enumerable<string>
  title?: string | null
  height?: number
  width?: number
  Author?: Prisma.AuthorCreateNestedManyWithoutImageInput
  MemberPlan?: Prisma.MemberPlanCreateNestedManyWithoutImageInput
  PeerProfile?: Prisma.PeerProfileCreateNestedManyWithoutLogoInput
  Comment?: Prisma.CommentCreateNestedManyWithoutGuestUserImageInput
  articleRevisionSocialMediaImages?: Prisma.ArticleRevisionCreateNestedManyWithoutSocialMediaImageInput
  articleRevisionImages?: Prisma.ArticleRevisionCreateNestedManyWithoutImageInput
  pageRevisionSocialMediaImages?: Prisma.PageRevisionCreateNestedManyWithoutSocialMediaImageInput
  pageRevisionImages?: Prisma.PageRevisionCreateNestedManyWithoutImageInput
  users?: Prisma.UserCreateNestedManyWithoutUserImageInput
  events?: Prisma.EventCreateNestedManyWithoutImageInput
}
declare type ImageFactoryDefineOptions = {
  defaultData?: Resolver<ImageFactoryDefineInput, BuildDataOptions>
}
export interface ImageFactoryInterface {
  readonly _factoryFor: 'Image'
  build(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Prisma.ImageCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.ImageCreateInput>
  ): PromiseLike<Prisma.ImageCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.ImageCreateInput>[]
  ): PromiseLike<Prisma.ImageCreateInput[]>
  pickForConnect(inputData: Image): Pick<Image, 'id'>
  create(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Image>
  createList(inputData: number | readonly Partial<Prisma.ImageCreateInput>[]): PromiseLike<Image[]>
  createForConnect(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Pick<Image, 'id'>>
}
/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
export declare function defineImageFactory(
  options?: ImageFactoryDefineOptions
): ImageFactoryInterface
declare type CommentsRevisionsCommentFactory = {
  _factoryFor: 'Comment'
  build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutRevisionsInput['create']>
}
declare type CommentsRevisionsFactoryDefineInput = {
  id?: string
  createdAt?: Date
  text?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue
  title?: string | null
  lead?: string | null
  Comment?: CommentsRevisionsCommentFactory | Prisma.CommentCreateNestedOneWithoutRevisionsInput
}
declare type CommentsRevisionsFactoryDefineOptions = {
  defaultData?: Resolver<CommentsRevisionsFactoryDefineInput, BuildDataOptions>
}
export interface CommentsRevisionsFactoryInterface {
  readonly _factoryFor: 'CommentsRevisions'
  build(
    inputData?: Partial<Prisma.CommentsRevisionsCreateInput>
  ): PromiseLike<Prisma.CommentsRevisionsCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentsRevisionsCreateInput>
  ): PromiseLike<Prisma.CommentsRevisionsCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]
  ): PromiseLike<Prisma.CommentsRevisionsCreateInput[]>
  pickForConnect(inputData: CommentsRevisions): Pick<CommentsRevisions, 'id'>
  create(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<CommentsRevisions>
  createList(
    inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]
  ): PromiseLike<CommentsRevisions[]>
  createForConnect(
    inputData?: Partial<Prisma.CommentsRevisionsCreateInput>
  ): PromiseLike<Pick<CommentsRevisions, 'id'>>
}
/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
export declare function defineCommentsRevisionsFactory(
  options?: CommentsRevisionsFactoryDefineOptions
): CommentsRevisionsFactoryInterface
declare type CommentpeerFactory = {
  _factoryFor: 'Peer'
  build: () => PromiseLike<Prisma.PeerCreateNestedOneWithoutCommentsInput['create']>
}
declare type CommentguestUserImageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutCommentInput['create']>
}
declare type CommentuserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutCommentInput['create']>
}
declare type CommentFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  itemID?: string
  itemType?: CommentItemType
  peer?: CommentpeerFactory | Prisma.PeerCreateNestedOneWithoutCommentsInput
  parentID?: string | null
  revisions?: Prisma.CommentsRevisionsCreateNestedManyWithoutCommentInput
  rejectionReason?: CommentRejectionReason | null
  state?: CommentState
  source?: string | null
  authorType?: CommentAuthorType
  guestUsername?: string | null
  guestUserImage?: CommentguestUserImageFactory | Prisma.ImageCreateNestedOneWithoutCommentInput
  user?: CommentuserFactory | Prisma.UserCreateNestedOneWithoutCommentInput
  tags?: Prisma.TaggedCommentsCreateNestedManyWithoutCommentInput
  ratings?: Prisma.CommentRatingCreateNestedManyWithoutCommentInput
  overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutCommentInput
}
declare type CommentFactoryDefineOptions = {
  defaultData?: Resolver<CommentFactoryDefineInput, BuildDataOptions>
}
export interface CommentFactoryInterface {
  readonly _factoryFor: 'Comment'
  build(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Prisma.CommentCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentCreateInput>
  ): PromiseLike<Prisma.CommentCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentCreateInput>[]
  ): PromiseLike<Prisma.CommentCreateInput[]>
  pickForConnect(inputData: Comment): Pick<Comment, 'id'>
  create(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Comment>
  createList(
    inputData: number | readonly Partial<Prisma.CommentCreateInput>[]
  ): PromiseLike<Comment[]>
  createForConnect(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Pick<Comment, 'id'>>
}
/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
export declare function defineCommentFactory(
  options?: CommentFactoryDefineOptions
): CommentFactoryInterface
declare type TaggedCommentscommentFactory = {
  _factoryFor: 'Comment'
  build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutTagsInput['create']>
}
declare type TaggedCommentstagFactory = {
  _factoryFor: 'Tag'
  build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutCommentsInput['create']>
}
declare type TaggedCommentsFactoryDefineInput = {
  comment: TaggedCommentscommentFactory | Prisma.CommentCreateNestedOneWithoutTagsInput
  tag: TaggedCommentstagFactory | Prisma.TagCreateNestedOneWithoutCommentsInput
  createdAt?: Date
  modifiedAt?: Date
}
declare type TaggedCommentsFactoryDefineOptions = {
  defaultData: Resolver<TaggedCommentsFactoryDefineInput, BuildDataOptions>
}
export interface TaggedCommentsFactoryInterface {
  readonly _factoryFor: 'TaggedComments'
  build(
    inputData?: Partial<Prisma.TaggedCommentsCreateInput>
  ): PromiseLike<Prisma.TaggedCommentsCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.TaggedCommentsCreateInput>
  ): PromiseLike<Prisma.TaggedCommentsCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]
  ): PromiseLike<Prisma.TaggedCommentsCreateInput[]>
  pickForConnect(inputData: TaggedComments): Pick<TaggedComments, 'commentId' | 'tagId'>
  create(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<TaggedComments>
  createList(
    inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]
  ): PromiseLike<TaggedComments[]>
  createForConnect(
    inputData?: Partial<Prisma.TaggedCommentsCreateInput>
  ): PromiseLike<Pick<TaggedComments, 'commentId' | 'tagId'>>
}
/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
export declare function defineTaggedCommentsFactory(
  options: TaggedCommentsFactoryDefineOptions
): TaggedCommentsFactoryInterface
declare type CommentRatingSystemFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string | null
  answers?: Prisma.CommentRatingSystemAnswerCreateNestedManyWithoutRatingSystemInput
}
declare type CommentRatingSystemFactoryDefineOptions = {
  defaultData?: Resolver<CommentRatingSystemFactoryDefineInput, BuildDataOptions>
}
export interface CommentRatingSystemFactoryInterface {
  readonly _factoryFor: 'CommentRatingSystem'
  build(
    inputData?: Partial<Prisma.CommentRatingSystemCreateInput>
  ): PromiseLike<Prisma.CommentRatingSystemCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentRatingSystemCreateInput>
  ): PromiseLike<Prisma.CommentRatingSystemCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]
  ): PromiseLike<Prisma.CommentRatingSystemCreateInput[]>
  pickForConnect(inputData: CommentRatingSystem): Pick<CommentRatingSystem, 'id'>
  create(
    inputData?: Partial<Prisma.CommentRatingSystemCreateInput>
  ): PromiseLike<CommentRatingSystem>
  createList(
    inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]
  ): PromiseLike<CommentRatingSystem[]>
  createForConnect(
    inputData?: Partial<Prisma.CommentRatingSystemCreateInput>
  ): PromiseLike<Pick<CommentRatingSystem, 'id'>>
}
/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
export declare function defineCommentRatingSystemFactory(
  options?: CommentRatingSystemFactoryDefineOptions
): CommentRatingSystemFactoryInterface
declare type CommentRatingSystemAnswerratingSystemFactory = {
  _factoryFor: 'CommentRatingSystem'
  build: () => PromiseLike<Prisma.CommentRatingSystemCreateNestedOneWithoutAnswersInput['create']>
}
declare type CommentRatingSystemAnswerFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  type?: RatingSystemType
  answer?: string | null
  ratingSystem:
    | CommentRatingSystemAnswerratingSystemFactory
    | Prisma.CommentRatingSystemCreateNestedOneWithoutAnswersInput
  ratings?: Prisma.CommentRatingCreateNestedManyWithoutAnswerInput
  overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutAnswerInput
}
declare type CommentRatingSystemAnswerFactoryDefineOptions = {
  defaultData: Resolver<CommentRatingSystemAnswerFactoryDefineInput, BuildDataOptions>
}
export interface CommentRatingSystemAnswerFactoryInterface {
  readonly _factoryFor: 'CommentRatingSystemAnswer'
  build(
    inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>
  ): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>
  ): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]
  ): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput[]>
  pickForConnect(inputData: CommentRatingSystemAnswer): Pick<CommentRatingSystemAnswer, 'id'>
  create(
    inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>
  ): PromiseLike<CommentRatingSystemAnswer>
  createList(
    inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]
  ): PromiseLike<CommentRatingSystemAnswer[]>
  createForConnect(
    inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>
  ): PromiseLike<Pick<CommentRatingSystemAnswer, 'id'>>
}
/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
export declare function defineCommentRatingSystemAnswerFactory(
  options: CommentRatingSystemAnswerFactoryDefineOptions
): CommentRatingSystemAnswerFactoryInterface
declare type CommentRatinguserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutCommentRatingInput['create']>
}
declare type CommentRatinganswerFactory = {
  _factoryFor: 'CommentRatingSystemAnswer'
  build: () => PromiseLike<
    Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput['create']
  >
}
declare type CommentRatingcommentFactory = {
  _factoryFor: 'Comment'
  build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutRatingsInput['create']>
}
declare type CommentRatingFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  user?: CommentRatinguserFactory | Prisma.UserCreateNestedOneWithoutCommentRatingInput
  answer:
    | CommentRatinganswerFactory
    | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput
  comment: CommentRatingcommentFactory | Prisma.CommentCreateNestedOneWithoutRatingsInput
  value?: number
  fingerprint?: string | null
  disabled?: boolean
}
declare type CommentRatingFactoryDefineOptions = {
  defaultData: Resolver<CommentRatingFactoryDefineInput, BuildDataOptions>
}
export interface CommentRatingFactoryInterface {
  readonly _factoryFor: 'CommentRating'
  build(
    inputData?: Partial<Prisma.CommentRatingCreateInput>
  ): PromiseLike<Prisma.CommentRatingCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentRatingCreateInput>
  ): PromiseLike<Prisma.CommentRatingCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]
  ): PromiseLike<Prisma.CommentRatingCreateInput[]>
  pickForConnect(inputData: CommentRating): Pick<CommentRating, 'id'>
  create(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<CommentRating>
  createList(
    inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]
  ): PromiseLike<CommentRating[]>
  createForConnect(
    inputData?: Partial<Prisma.CommentRatingCreateInput>
  ): PromiseLike<Pick<CommentRating, 'id'>>
}
/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
export declare function defineCommentRatingFactory(
  options: CommentRatingFactoryDefineOptions
): CommentRatingFactoryInterface
declare type CommentRatingOverrideanswerFactory = {
  _factoryFor: 'CommentRatingSystemAnswer'
  build: () => PromiseLike<
    Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput['create']
  >
}
declare type CommentRatingOverridecommentFactory = {
  _factoryFor: 'Comment'
  build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput['create']>
}
declare type CommentRatingOverrideFactoryDefineInput = {
  answer:
    | CommentRatingOverrideanswerFactory
    | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput
  comment:
    | CommentRatingOverridecommentFactory
    | Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput
  createdAt?: Date
  modifiedAt?: Date
  value?: number | null
}
declare type CommentRatingOverrideFactoryDefineOptions = {
  defaultData: Resolver<CommentRatingOverrideFactoryDefineInput, BuildDataOptions>
}
export interface CommentRatingOverrideFactoryInterface {
  readonly _factoryFor: 'CommentRatingOverride'
  build(
    inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>
  ): PromiseLike<Prisma.CommentRatingOverrideCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>
  ): PromiseLike<Prisma.CommentRatingOverrideCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]
  ): PromiseLike<Prisma.CommentRatingOverrideCreateInput[]>
  pickForConnect(
    inputData: CommentRatingOverride
  ): Pick<CommentRatingOverride, 'answerId' | 'commentId'>
  create(
    inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>
  ): PromiseLike<CommentRatingOverride>
  createList(
    inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]
  ): PromiseLike<CommentRatingOverride[]>
  createForConnect(
    inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>
  ): PromiseLike<Pick<CommentRatingOverride, 'answerId' | 'commentId'>>
}
/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
export declare function defineCommentRatingOverrideFactory(
  options: CommentRatingOverrideFactoryDefineOptions
): CommentRatingOverrideFactoryInterface
declare type InvoiceIteminvoicesFactory = {
  _factoryFor: 'Invoice'
  build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutItemsInput['create']>
}
declare type InvoiceItemFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  description?: string | null
  quantity?: number
  amount?: number
  invoices?: InvoiceIteminvoicesFactory | Prisma.InvoiceCreateNestedOneWithoutItemsInput
}
declare type InvoiceItemFactoryDefineOptions = {
  defaultData?: Resolver<InvoiceItemFactoryDefineInput, BuildDataOptions>
}
export interface InvoiceItemFactoryInterface {
  readonly _factoryFor: 'InvoiceItem'
  build(
    inputData?: Partial<Prisma.InvoiceItemCreateInput>
  ): PromiseLike<Prisma.InvoiceItemCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.InvoiceItemCreateInput>
  ): PromiseLike<Prisma.InvoiceItemCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]
  ): PromiseLike<Prisma.InvoiceItemCreateInput[]>
  pickForConnect(inputData: InvoiceItem): Pick<InvoiceItem, 'id'>
  create(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<InvoiceItem>
  createList(
    inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]
  ): PromiseLike<InvoiceItem[]>
  createForConnect(
    inputData?: Partial<Prisma.InvoiceItemCreateInput>
  ): PromiseLike<Pick<InvoiceItem, 'id'>>
}
/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
export declare function defineInvoiceItemFactory(
  options?: InvoiceItemFactoryDefineOptions
): InvoiceItemFactoryInterface
declare type InvoicesubscriptionFactory = {
  _factoryFor: 'Subscription'
  build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput['create']>
}
declare type InvoiceFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  mail?: string
  dueAt?: Date
  description?: string | null
  paidAt?: Date | null
  canceledAt?: Date | null
  paymentDeadline?: Date | null
  items?: Prisma.InvoiceItemCreateNestedManyWithoutInvoicesInput
  manuallySetAsPaidByUserId?: string | null
  subscription?: InvoicesubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput
  subscriptionPeriods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutInvoiceInput
}
declare type InvoiceFactoryDefineOptions = {
  defaultData?: Resolver<InvoiceFactoryDefineInput, BuildDataOptions>
}
export interface InvoiceFactoryInterface {
  readonly _factoryFor: 'Invoice'
  build(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Prisma.InvoiceCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.InvoiceCreateInput>
  ): PromiseLike<Prisma.InvoiceCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]
  ): PromiseLike<Prisma.InvoiceCreateInput[]>
  pickForConnect(inputData: Invoice): Pick<Invoice, 'id'>
  create(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Invoice>
  createList(
    inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]
  ): PromiseLike<Invoice[]>
  createForConnect(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Pick<Invoice, 'id'>>
}
/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export declare function defineInvoiceFactory(
  options?: InvoiceFactoryDefineOptions
): InvoiceFactoryInterface
declare type MailLogrecipientFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutMailSentInput['create']>
}
declare type MailLogmailTemplateFactory = {
  _factoryFor: 'MailTemplate'
  build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutMailLogInput['create']>
}
declare type MailLogFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  recipient: MailLogrecipientFactory | Prisma.UserCreateNestedOneWithoutMailSentInput
  state?: MailLogState
  sentDate?: Date
  mailProviderID?: string
  mailIdentifier?: string
  mailTemplate: MailLogmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutMailLogInput
  mailData?: string | null
  subject?: string | null
}
declare type MailLogFactoryDefineOptions = {
  defaultData: Resolver<MailLogFactoryDefineInput, BuildDataOptions>
}
export interface MailLogFactoryInterface {
  readonly _factoryFor: 'MailLog'
  build(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Prisma.MailLogCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.MailLogCreateInput>
  ): PromiseLike<Prisma.MailLogCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]
  ): PromiseLike<Prisma.MailLogCreateInput[]>
  pickForConnect(inputData: MailLog): Pick<MailLog, 'id'>
  create(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<MailLog>
  createList(
    inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]
  ): PromiseLike<MailLog[]>
  createForConnect(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Pick<MailLog, 'id'>>
}
/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
export declare function defineMailLogFactory(
  options: MailLogFactoryDefineOptions
): MailLogFactoryInterface
declare type AvailablePaymentMethodMemberPlanFactory = {
  _factoryFor: 'MemberPlan'
  build: () => PromiseLike<
    Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput['create']
  >
}
declare type AvailablePaymentMethodFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  paymentMethodIDs?:
    | Prisma.AvailablePaymentMethodCreatepaymentMethodIDsInput
    | Prisma.Enumerable<string>
  paymentPeriodicities?:
    | Prisma.AvailablePaymentMethodCreatepaymentPeriodicitiesInput
    | Prisma.Enumerable<PaymentPeriodicity>
  forceAutoRenewal?: boolean
  MemberPlan?:
    | AvailablePaymentMethodMemberPlanFactory
    | Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput
}
declare type AvailablePaymentMethodFactoryDefineOptions = {
  defaultData?: Resolver<AvailablePaymentMethodFactoryDefineInput, BuildDataOptions>
}
export interface AvailablePaymentMethodFactoryInterface {
  readonly _factoryFor: 'AvailablePaymentMethod'
  build(
    inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>
  ): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>
  ): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]
  ): PromiseLike<Prisma.AvailablePaymentMethodCreateInput[]>
  pickForConnect(inputData: AvailablePaymentMethod): Pick<AvailablePaymentMethod, 'id'>
  create(
    inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>
  ): PromiseLike<AvailablePaymentMethod>
  createList(
    inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]
  ): PromiseLike<AvailablePaymentMethod[]>
  createForConnect(
    inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>
  ): PromiseLike<Pick<AvailablePaymentMethod, 'id'>>
}
/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
export declare function defineAvailablePaymentMethodFactory(
  options?: AvailablePaymentMethodFactoryDefineOptions
): AvailablePaymentMethodFactoryInterface
declare type MemberPlanimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutMemberPlanInput['create']>
}
declare type MemberPlanFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  slug?: string
  tags?: Prisma.MemberPlanCreatetagsInput | Prisma.Enumerable<string>
  description?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  active?: boolean
  amountPerMonthMin?: number
  availablePaymentMethods?: Prisma.AvailablePaymentMethodCreateNestedManyWithoutMemberPlanInput
  image?: MemberPlanimageFactory | Prisma.ImageCreateNestedOneWithoutMemberPlanInput
  Subscription?: Prisma.SubscriptionCreateNestedManyWithoutMemberPlanInput
  subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutMemberPlanInput
}
declare type MemberPlanFactoryDefineOptions = {
  defaultData?: Resolver<MemberPlanFactoryDefineInput, BuildDataOptions>
}
export interface MemberPlanFactoryInterface {
  readonly _factoryFor: 'MemberPlan'
  build(
    inputData?: Partial<Prisma.MemberPlanCreateInput>
  ): PromiseLike<Prisma.MemberPlanCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.MemberPlanCreateInput>
  ): PromiseLike<Prisma.MemberPlanCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]
  ): PromiseLike<Prisma.MemberPlanCreateInput[]>
  pickForConnect(inputData: MemberPlan): Pick<MemberPlan, 'id'>
  create(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<MemberPlan>
  createList(
    inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]
  ): PromiseLike<MemberPlan[]>
  createForConnect(
    inputData?: Partial<Prisma.MemberPlanCreateInput>
  ): PromiseLike<Pick<MemberPlan, 'id'>>
}
/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
export declare function defineMemberPlanFactory(
  options?: MemberPlanFactoryDefineOptions
): MemberPlanFactoryInterface
declare type NavigationLinkpageFactory = {
  _factoryFor: 'Page'
  build: () => PromiseLike<Prisma.PageCreateNestedOneWithoutNavigationsInput['create']>
}
declare type NavigationLinkarticleFactory = {
  _factoryFor: 'Article'
  build: () => PromiseLike<Prisma.ArticleCreateNestedOneWithoutNavigationsInput['create']>
}
declare type NavigationLinknavigationFactory = {
  _factoryFor: 'Navigation'
  build: () => PromiseLike<Prisma.NavigationCreateNestedOneWithoutLinksInput['create']>
}
declare type NavigationLinkFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  label?: string
  type?: string
  url?: string | null
  page?: NavigationLinkpageFactory | Prisma.PageCreateNestedOneWithoutNavigationsInput
  article?: NavigationLinkarticleFactory | Prisma.ArticleCreateNestedOneWithoutNavigationsInput
  navigation?: NavigationLinknavigationFactory | Prisma.NavigationCreateNestedOneWithoutLinksInput
}
declare type NavigationLinkFactoryDefineOptions = {
  defaultData?: Resolver<NavigationLinkFactoryDefineInput, BuildDataOptions>
}
export interface NavigationLinkFactoryInterface {
  readonly _factoryFor: 'NavigationLink'
  build(
    inputData?: Partial<Prisma.NavigationLinkCreateInput>
  ): PromiseLike<Prisma.NavigationLinkCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.NavigationLinkCreateInput>
  ): PromiseLike<Prisma.NavigationLinkCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]
  ): PromiseLike<Prisma.NavigationLinkCreateInput[]>
  pickForConnect(inputData: NavigationLink): Pick<NavigationLink, 'id'>
  create(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<NavigationLink>
  createList(
    inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]
  ): PromiseLike<NavigationLink[]>
  createForConnect(
    inputData?: Partial<Prisma.NavigationLinkCreateInput>
  ): PromiseLike<Pick<NavigationLink, 'id'>>
}
/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
export declare function defineNavigationLinkFactory(
  options?: NavigationLinkFactoryDefineOptions
): NavigationLinkFactoryInterface
declare type NavigationFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  key?: string
  links?: Prisma.NavigationLinkCreateNestedManyWithoutNavigationInput
  name?: string
}
declare type NavigationFactoryDefineOptions = {
  defaultData?: Resolver<NavigationFactoryDefineInput, BuildDataOptions>
}
export interface NavigationFactoryInterface {
  readonly _factoryFor: 'Navigation'
  build(
    inputData?: Partial<Prisma.NavigationCreateInput>
  ): PromiseLike<Prisma.NavigationCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.NavigationCreateInput>
  ): PromiseLike<Prisma.NavigationCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]
  ): PromiseLike<Prisma.NavigationCreateInput[]>
  pickForConnect(inputData: Navigation): Pick<Navigation, 'id'>
  create(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Navigation>
  createList(
    inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]
  ): PromiseLike<Navigation[]>
  createForConnect(
    inputData?: Partial<Prisma.NavigationCreateInput>
  ): PromiseLike<Pick<Navigation, 'id'>>
}
/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
export declare function defineNavigationFactory(
  options?: NavigationFactoryDefineOptions
): NavigationFactoryInterface
declare type PageRevisionimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput['create']>
}
declare type PageRevisionsocialMediaImageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<
    Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput['create']
  >
}
declare type PageRevisionFactoryDefineInput = {
  id?: string
  revision?: number
  createdAt?: Date
  modifiedAt?: Date | null
  updatedAt?: Date | null
  publishedAt?: Date | null
  publishAt?: Date | null
  slug?: string | null
  title?: string
  description?: string | null
  tags?: Prisma.PageRevisionCreatetagsInput | Prisma.Enumerable<string>
  properties?: Prisma.MetadataPropertyCreateNestedManyWithoutPageRevisionInput
  image?: PageRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput
  socialMediaTitle?: string | null
  socialMediaDescription?: string | null
  socialMediaImage?:
    | PageRevisionsocialMediaImageFactory
    | Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput
  blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  PublishedPage?: Prisma.PageCreateNestedManyWithoutPublishedInput
  PendingPage?: Prisma.PageCreateNestedManyWithoutPendingInput
  DraftPage?: Prisma.PageCreateNestedManyWithoutDraftInput
}
declare type PageRevisionFactoryDefineOptions = {
  defaultData?: Resolver<PageRevisionFactoryDefineInput, BuildDataOptions>
}
export interface PageRevisionFactoryInterface {
  readonly _factoryFor: 'PageRevision'
  build(
    inputData?: Partial<Prisma.PageRevisionCreateInput>
  ): PromiseLike<Prisma.PageRevisionCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PageRevisionCreateInput>
  ): PromiseLike<Prisma.PageRevisionCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]
  ): PromiseLike<Prisma.PageRevisionCreateInput[]>
  pickForConnect(inputData: PageRevision): Pick<PageRevision, 'id'>
  create(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<PageRevision>
  createList(
    inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]
  ): PromiseLike<PageRevision[]>
  createForConnect(
    inputData?: Partial<Prisma.PageRevisionCreateInput>
  ): PromiseLike<Pick<PageRevision, 'id'>>
}
/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
export declare function definePageRevisionFactory(
  options?: PageRevisionFactoryDefineOptions
): PageRevisionFactoryInterface
declare type PagepublishedFactory = {
  _factoryFor: 'PageRevision'
  build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPublishedPageInput['create']>
}
declare type PagependingFactory = {
  _factoryFor: 'PageRevision'
  build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPendingPageInput['create']>
}
declare type PagedraftFactory = {
  _factoryFor: 'PageRevision'
  build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutDraftPageInput['create']>
}
declare type PageFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  published?: PagepublishedFactory | Prisma.PageRevisionCreateNestedOneWithoutPublishedPageInput
  pending?: PagependingFactory | Prisma.PageRevisionCreateNestedOneWithoutPendingPageInput
  draft?: PagedraftFactory | Prisma.PageRevisionCreateNestedOneWithoutDraftPageInput
  navigations?: Prisma.NavigationLinkCreateNestedManyWithoutPageInput
}
declare type PageFactoryDefineOptions = {
  defaultData?: Resolver<PageFactoryDefineInput, BuildDataOptions>
}
export interface PageFactoryInterface {
  readonly _factoryFor: 'Page'
  build(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>
  buildCreateInput(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PageCreateInput>[]
  ): PromiseLike<Prisma.PageCreateInput[]>
  pickForConnect(inputData: Page): Pick<Page, 'id'>
  create(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Page>
  createList(inputData: number | readonly Partial<Prisma.PageCreateInput>[]): PromiseLike<Page[]>
  createForConnect(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Pick<Page, 'id'>>
}
/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
export declare function definePageFactory(options?: PageFactoryDefineOptions): PageFactoryInterface
declare type PaymentMethodFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  slug?: string
  description?: string
  paymentProviderID?: string
  active?: boolean
  Subscription?: Prisma.SubscriptionCreateNestedManyWithoutPaymentMethodInput
  Payment?: Prisma.PaymentCreateNestedManyWithoutPaymentMethodInput
  subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutPaymentMethodsInput
}
declare type PaymentMethodFactoryDefineOptions = {
  defaultData?: Resolver<PaymentMethodFactoryDefineInput, BuildDataOptions>
}
export interface PaymentMethodFactoryInterface {
  readonly _factoryFor: 'PaymentMethod'
  build(
    inputData?: Partial<Prisma.PaymentMethodCreateInput>
  ): PromiseLike<Prisma.PaymentMethodCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PaymentMethodCreateInput>
  ): PromiseLike<Prisma.PaymentMethodCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]
  ): PromiseLike<Prisma.PaymentMethodCreateInput[]>
  pickForConnect(inputData: PaymentMethod): Pick<PaymentMethod, 'id'>
  create(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<PaymentMethod>
  createList(
    inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]
  ): PromiseLike<PaymentMethod[]>
  createForConnect(
    inputData?: Partial<Prisma.PaymentMethodCreateInput>
  ): PromiseLike<Pick<PaymentMethod, 'id'>>
}
/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
export declare function definePaymentMethodFactory(
  options?: PaymentMethodFactoryDefineOptions
): PaymentMethodFactoryInterface
declare type PaymentpaymentMethodFactory = {
  _factoryFor: 'PaymentMethod'
  build: () => PromiseLike<Prisma.PaymentMethodCreateNestedOneWithoutPaymentInput['create']>
}
declare type PaymentFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  invoiceID?: string
  state?: PaymentState
  intentID?: string | null
  intentSecret?: string | null
  intentData?: string | null
  paymentData?: string | null
  paymentMethod:
    | PaymentpaymentMethodFactory
    | Prisma.PaymentMethodCreateNestedOneWithoutPaymentInput
}
declare type PaymentFactoryDefineOptions = {
  defaultData: Resolver<PaymentFactoryDefineInput, BuildDataOptions>
}
export interface PaymentFactoryInterface {
  readonly _factoryFor: 'Payment'
  build(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Prisma.PaymentCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PaymentCreateInput>
  ): PromiseLike<Prisma.PaymentCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]
  ): PromiseLike<Prisma.PaymentCreateInput[]>
  pickForConnect(inputData: Payment): Pick<Payment, 'id'>
  create(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Payment>
  createList(
    inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]
  ): PromiseLike<Payment[]>
  createForConnect(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Pick<Payment, 'id'>>
}
/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export declare function definePaymentFactory(
  options: PaymentFactoryDefineOptions
): PaymentFactoryInterface
declare type PeerProfilelogoFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPeerProfileInput['create']>
}
declare type PeerProfileFactoryDefineInput = {
  id?: string
  name?: string
  themeColor?: string
  themeFontColor?: string
  callToActionURL?: string
  callToActionText?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  callToActionImageURL?: string | null
  callToActionImageID?: string | null
  logo?: PeerProfilelogoFactory | Prisma.ImageCreateNestedOneWithoutPeerProfileInput
}
declare type PeerProfileFactoryDefineOptions = {
  defaultData?: Resolver<PeerProfileFactoryDefineInput, BuildDataOptions>
}
export interface PeerProfileFactoryInterface {
  readonly _factoryFor: 'PeerProfile'
  build(
    inputData?: Partial<Prisma.PeerProfileCreateInput>
  ): PromiseLike<Prisma.PeerProfileCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PeerProfileCreateInput>
  ): PromiseLike<Prisma.PeerProfileCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]
  ): PromiseLike<Prisma.PeerProfileCreateInput[]>
  pickForConnect(inputData: PeerProfile): Pick<PeerProfile, 'id'>
  create(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<PeerProfile>
  createList(
    inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]
  ): PromiseLike<PeerProfile[]>
  createForConnect(
    inputData?: Partial<Prisma.PeerProfileCreateInput>
  ): PromiseLike<Pick<PeerProfile, 'id'>>
}
/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
export declare function definePeerProfileFactory(
  options?: PeerProfileFactoryDefineOptions
): PeerProfileFactoryInterface
declare type PeerFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  slug?: string
  hostURL?: string
  token?: string
  isDisabled?: boolean
  comments?: Prisma.CommentCreateNestedManyWithoutPeerInput
}
declare type PeerFactoryDefineOptions = {
  defaultData?: Resolver<PeerFactoryDefineInput, BuildDataOptions>
}
export interface PeerFactoryInterface {
  readonly _factoryFor: 'Peer'
  build(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>
  buildCreateInput(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PeerCreateInput>[]
  ): PromiseLike<Prisma.PeerCreateInput[]>
  pickForConnect(inputData: Peer): Pick<Peer, 'id'>
  create(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Peer>
  createList(inputData: number | readonly Partial<Prisma.PeerCreateInput>[]): PromiseLike<Peer[]>
  createForConnect(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Pick<Peer, 'id'>>
}
/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
export declare function definePeerFactory(options?: PeerFactoryDefineOptions): PeerFactoryInterface
declare type TokenFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  token?: string
  roleIDs?: Prisma.TokenCreateroleIDsInput | Prisma.Enumerable<string>
}
declare type TokenFactoryDefineOptions = {
  defaultData?: Resolver<TokenFactoryDefineInput, BuildDataOptions>
}
export interface TokenFactoryInterface {
  readonly _factoryFor: 'Token'
  build(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Prisma.TokenCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.TokenCreateInput>
  ): PromiseLike<Prisma.TokenCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.TokenCreateInput>[]
  ): PromiseLike<Prisma.TokenCreateInput[]>
  pickForConnect(inputData: Token): Pick<Token, 'id'>
  create(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Token>
  createList(inputData: number | readonly Partial<Prisma.TokenCreateInput>[]): PromiseLike<Token[]>
  createForConnect(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Pick<Token, 'id'>>
}
/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
export declare function defineTokenFactory(
  options?: TokenFactoryDefineOptions
): TokenFactoryInterface
declare type SessionuserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutSessionInput['create']>
}
declare type SessionFactoryDefineInput = {
  id?: string
  createdAt?: Date
  expiresAt?: Date
  token?: string
  user: SessionuserFactory | Prisma.UserCreateNestedOneWithoutSessionInput
}
declare type SessionFactoryDefineOptions = {
  defaultData: Resolver<SessionFactoryDefineInput, BuildDataOptions>
}
export interface SessionFactoryInterface {
  readonly _factoryFor: 'Session'
  build(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SessionCreateInput>
  ): PromiseLike<Prisma.SessionCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SessionCreateInput>[]
  ): PromiseLike<Prisma.SessionCreateInput[]>
  pickForConnect(inputData: Session): Pick<Session, 'id'>
  create(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Session>
  createList(
    inputData: number | readonly Partial<Prisma.SessionCreateInput>[]
  ): PromiseLike<Session[]>
  createForConnect(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Pick<Session, 'id'>>
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export declare function defineSessionFactory(
  options: SessionFactoryDefineOptions
): SessionFactoryInterface
declare type SubscriptionPeriodinvoiceFactory = {
  _factoryFor: 'Invoice'
  build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutSubscriptionPeriodsInput['create']>
}
declare type SubscriptionPeriodsubscriptionFactory = {
  _factoryFor: 'Subscription'
  build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutPeriodsInput['create']>
}
declare type SubscriptionPeriodFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  startsAt?: Date
  endsAt?: Date
  paymentPeriodicity?: PaymentPeriodicity
  amount?: number
  invoice:
    | SubscriptionPeriodinvoiceFactory
    | Prisma.InvoiceCreateNestedOneWithoutSubscriptionPeriodsInput
  subscription?:
    | SubscriptionPeriodsubscriptionFactory
    | Prisma.SubscriptionCreateNestedOneWithoutPeriodsInput
}
declare type SubscriptionPeriodFactoryDefineOptions = {
  defaultData: Resolver<SubscriptionPeriodFactoryDefineInput, BuildDataOptions>
}
export interface SubscriptionPeriodFactoryInterface {
  readonly _factoryFor: 'SubscriptionPeriod'
  build(
    inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>
  ): PromiseLike<Prisma.SubscriptionPeriodCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>
  ): PromiseLike<Prisma.SubscriptionPeriodCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]
  ): PromiseLike<Prisma.SubscriptionPeriodCreateInput[]>
  pickForConnect(inputData: SubscriptionPeriod): Pick<SubscriptionPeriod, 'id'>
  create(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<SubscriptionPeriod>
  createList(
    inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]
  ): PromiseLike<SubscriptionPeriod[]>
  createForConnect(
    inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>
  ): PromiseLike<Pick<SubscriptionPeriod, 'id'>>
}
/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
export declare function defineSubscriptionPeriodFactory(
  options: SubscriptionPeriodFactoryDefineOptions
): SubscriptionPeriodFactoryInterface
declare type SubscriptionDeactivationsubscriptionFactory = {
  _factoryFor: 'Subscription'
  build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutDeactivationInput['create']>
}
declare type SubscriptionDeactivationFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  date?: Date
  reason?: SubscriptionDeactivationReason
  subscription:
    | SubscriptionDeactivationsubscriptionFactory
    | Prisma.SubscriptionCreateNestedOneWithoutDeactivationInput
}
declare type SubscriptionDeactivationFactoryDefineOptions = {
  defaultData: Resolver<SubscriptionDeactivationFactoryDefineInput, BuildDataOptions>
}
export interface SubscriptionDeactivationFactoryInterface {
  readonly _factoryFor: 'SubscriptionDeactivation'
  build(
    inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>
  ): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>
  ): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]
  ): PromiseLike<Prisma.SubscriptionDeactivationCreateInput[]>
  pickForConnect(inputData: SubscriptionDeactivation): Pick<SubscriptionDeactivation, 'id'>
  create(
    inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>
  ): PromiseLike<SubscriptionDeactivation>
  createList(
    inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]
  ): PromiseLike<SubscriptionDeactivation[]>
  createForConnect(
    inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>
  ): PromiseLike<Pick<SubscriptionDeactivation, 'id'>>
}
/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
export declare function defineSubscriptionDeactivationFactory(
  options: SubscriptionDeactivationFactoryDefineOptions
): SubscriptionDeactivationFactoryInterface
declare type SubscriptiondeactivationFactory = {
  _factoryFor: 'SubscriptionDeactivation'
  build: () => PromiseLike<
    Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput['create']
  >
}
declare type SubscriptionpaymentMethodFactory = {
  _factoryFor: 'PaymentMethod'
  build: () => PromiseLike<Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput['create']>
}
declare type SubscriptionmemberPlanFactory = {
  _factoryFor: 'MemberPlan'
  build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput['create']>
}
declare type SubscriptionuserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutSubscriptionInput['create']>
}
declare type SubscriptionFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  paymentPeriodicity?: PaymentPeriodicity
  monthlyAmount?: number
  autoRenew?: boolean
  startsAt?: Date
  paidUntil?: Date | null
  periods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutSubscriptionInput
  properties?: Prisma.MetadataPropertyCreateNestedManyWithoutSubscriptionInput
  deactivation?:
    | SubscriptiondeactivationFactory
    | Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput
  paymentMethod:
    | SubscriptionpaymentMethodFactory
    | Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput
  memberPlan:
    | SubscriptionmemberPlanFactory
    | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput
  user: SubscriptionuserFactory | Prisma.UserCreateNestedOneWithoutSubscriptionInput
  invoices?: Prisma.InvoiceCreateNestedManyWithoutSubscriptionInput
}
declare type SubscriptionFactoryDefineOptions = {
  defaultData: Resolver<SubscriptionFactoryDefineInput, BuildDataOptions>
}
export interface SubscriptionFactoryInterface {
  readonly _factoryFor: 'Subscription'
  build(
    inputData?: Partial<Prisma.SubscriptionCreateInput>
  ): PromiseLike<Prisma.SubscriptionCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SubscriptionCreateInput>
  ): PromiseLike<Prisma.SubscriptionCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]
  ): PromiseLike<Prisma.SubscriptionCreateInput[]>
  pickForConnect(inputData: Subscription): Pick<Subscription, 'id'>
  create(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Subscription>
  createList(
    inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]
  ): PromiseLike<Subscription[]>
  createForConnect(
    inputData?: Partial<Prisma.SubscriptionCreateInput>
  ): PromiseLike<Pick<Subscription, 'id'>>
}
/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
export declare function defineSubscriptionFactory(
  options: SubscriptionFactoryDefineOptions
): SubscriptionFactoryInterface
declare type UserAddressUserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutAddressInput['create']>
}
declare type UserAddressFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  company?: string | null
  streetAddress?: string | null
  streetAddress2?: string | null
  zipCode?: string | null
  city?: string | null
  country?: string | null
  User: UserAddressUserFactory | Prisma.UserCreateNestedOneWithoutAddressInput
}
declare type UserAddressFactoryDefineOptions = {
  defaultData: Resolver<UserAddressFactoryDefineInput, BuildDataOptions>
}
export interface UserAddressFactoryInterface {
  readonly _factoryFor: 'UserAddress'
  build(
    inputData?: Partial<Prisma.UserAddressCreateInput>
  ): PromiseLike<Prisma.UserAddressCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.UserAddressCreateInput>
  ): PromiseLike<Prisma.UserAddressCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]
  ): PromiseLike<Prisma.UserAddressCreateInput[]>
  pickForConnect(inputData: UserAddress): Pick<UserAddress, 'userId'>
  create(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<UserAddress>
  createList(
    inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]
  ): PromiseLike<UserAddress[]>
  createForConnect(
    inputData?: Partial<Prisma.UserAddressCreateInput>
  ): PromiseLike<Pick<UserAddress, 'userId'>>
}
/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
export declare function defineUserAddressFactory(
  options: UserAddressFactoryDefineOptions
): UserAddressFactoryInterface
declare type UserOAuth2AccountUserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutOauth2AccountsInput['create']>
}
declare type UserOAuth2AccountFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  type?: string
  provider?: string
  providerAccountId?: string
  refreshToken?: string | null
  accessToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
  idToken?: string
  oauthTokenSecret?: string | null
  oauthToken?: string | null
  sessionState?: string | null
  User?: UserOAuth2AccountUserFactory | Prisma.UserCreateNestedOneWithoutOauth2AccountsInput
}
declare type UserOAuth2AccountFactoryDefineOptions = {
  defaultData?: Resolver<UserOAuth2AccountFactoryDefineInput, BuildDataOptions>
}
export interface UserOAuth2AccountFactoryInterface {
  readonly _factoryFor: 'UserOAuth2Account'
  build(
    inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>
  ): PromiseLike<Prisma.UserOAuth2AccountCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>
  ): PromiseLike<Prisma.UserOAuth2AccountCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]
  ): PromiseLike<Prisma.UserOAuth2AccountCreateInput[]>
  pickForConnect(inputData: UserOAuth2Account): Pick<UserOAuth2Account, 'id'>
  create(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<UserOAuth2Account>
  createList(
    inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]
  ): PromiseLike<UserOAuth2Account[]>
  createForConnect(
    inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>
  ): PromiseLike<Pick<UserOAuth2Account, 'id'>>
}
/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
export declare function defineUserOAuth2AccountFactory(
  options?: UserOAuth2AccountFactoryDefineOptions
): UserOAuth2AccountFactoryInterface
declare type PaymentProviderCustomerUserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPaymentProviderCustomersInput['create']>
}
declare type PaymentProviderCustomerFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  paymentProviderID?: string
  customerID?: string
  User?:
    | PaymentProviderCustomerUserFactory
    | Prisma.UserCreateNestedOneWithoutPaymentProviderCustomersInput
}
declare type PaymentProviderCustomerFactoryDefineOptions = {
  defaultData?: Resolver<PaymentProviderCustomerFactoryDefineInput, BuildDataOptions>
}
export interface PaymentProviderCustomerFactoryInterface {
  readonly _factoryFor: 'PaymentProviderCustomer'
  build(
    inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>
  ): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>
  ): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]
  ): PromiseLike<Prisma.PaymentProviderCustomerCreateInput[]>
  pickForConnect(inputData: PaymentProviderCustomer): Pick<PaymentProviderCustomer, 'id'>
  create(
    inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>
  ): PromiseLike<PaymentProviderCustomer>
  createList(
    inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]
  ): PromiseLike<PaymentProviderCustomer[]>
  createForConnect(
    inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>
  ): PromiseLike<Pick<PaymentProviderCustomer, 'id'>>
}
/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
export declare function definePaymentProviderCustomerFactory(
  options?: PaymentProviderCustomerFactoryDefineOptions
): PaymentProviderCustomerFactoryInterface
declare type UseruserImageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutUsersInput['create']>
}
declare type UseraddressFactory = {
  _factoryFor: 'UserAddress'
  build: () => PromiseLike<Prisma.UserAddressCreateNestedOneWithoutUserInput['create']>
}
declare type UserFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  email?: string
  emailVerifiedAt?: Date | null
  name?: string
  firstName?: string | null
  preferredName?: string | null
  password?: string
  active?: boolean
  lastLogin?: Date | null
  roleIDs?: Prisma.UserCreateroleIDsInput | Prisma.Enumerable<string>
  userImage?: UseruserImageFactory | Prisma.ImageCreateNestedOneWithoutUsersInput
  address?: UseraddressFactory | Prisma.UserAddressCreateNestedOneWithoutUserInput
  properties?: Prisma.MetadataPropertyCreateNestedManyWithoutUserInput
  oauth2Accounts?: Prisma.UserOAuth2AccountCreateNestedManyWithoutUserInput
  paymentProviderCustomers?: Prisma.PaymentProviderCustomerCreateNestedManyWithoutUserInput
  Comment?: Prisma.CommentCreateNestedManyWithoutUserInput
  Session?: Prisma.SessionCreateNestedManyWithoutUserInput
  Subscription?: Prisma.SubscriptionCreateNestedManyWithoutUserInput
  CommentRating?: Prisma.CommentRatingCreateNestedManyWithoutUserInput
  PollVote?: Prisma.PollVoteCreateNestedManyWithoutUserInput
  mailSent?: Prisma.MailLogCreateNestedManyWithoutRecipientInput
}
declare type UserFactoryDefineOptions = {
  defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions>
}
export interface UserFactoryInterface {
  readonly _factoryFor: 'User'
  build(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>
  buildCreateInput(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.UserCreateInput>[]
  ): PromiseLike<Prisma.UserCreateInput[]>
  pickForConnect(inputData: User): Pick<User, 'id'>
  create(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<User>
  createList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<User[]>
  createForConnect(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Pick<User, 'id'>>
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export declare function defineUserFactory(options?: UserFactoryDefineOptions): UserFactoryInterface
declare type UserRoleFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  description?: string | null
  name?: string
  permissionIDs?: Prisma.UserRoleCreatepermissionIDsInput | Prisma.Enumerable<string>
  systemRole?: boolean
}
declare type UserRoleFactoryDefineOptions = {
  defaultData?: Resolver<UserRoleFactoryDefineInput, BuildDataOptions>
}
export interface UserRoleFactoryInterface {
  readonly _factoryFor: 'UserRole'
  build(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Prisma.UserRoleCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.UserRoleCreateInput>
  ): PromiseLike<Prisma.UserRoleCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]
  ): PromiseLike<Prisma.UserRoleCreateInput[]>
  pickForConnect(inputData: UserRole): Pick<UserRole, 'id'>
  create(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<UserRole>
  createList(
    inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]
  ): PromiseLike<UserRole[]>
  createForConnect(
    inputData?: Partial<Prisma.UserRoleCreateInput>
  ): PromiseLike<Pick<UserRole, 'id'>>
}
/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
export declare function defineUserRoleFactory(
  options?: UserRoleFactoryDefineOptions
): UserRoleFactoryInterface
declare type SettingFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  value?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
  settingRestriction?: Prisma.JsonNullValueInput | Prisma.InputJsonValue
}
declare type SettingFactoryDefineOptions = {
  defaultData?: Resolver<SettingFactoryDefineInput, BuildDataOptions>
}
export interface SettingFactoryInterface {
  readonly _factoryFor: 'Setting'
  build(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Prisma.SettingCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SettingCreateInput>
  ): PromiseLike<Prisma.SettingCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SettingCreateInput>[]
  ): PromiseLike<Prisma.SettingCreateInput[]>
  pickForConnect(inputData: Setting): Pick<Setting, 'id'>
  create(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Setting>
  createList(
    inputData: number | readonly Partial<Prisma.SettingCreateInput>[]
  ): PromiseLike<Setting[]>
  createForConnect(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Pick<Setting, 'id'>>
}
/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
export declare function defineSettingFactory(
  options?: SettingFactoryDefineOptions
): SettingFactoryInterface
declare type TagFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  type?: TagType
  tag?: string | null
  comments?: Prisma.TaggedCommentsCreateNestedManyWithoutTagInput
  events?: Prisma.TaggedEventsCreateNestedManyWithoutTagInput
}
declare type TagFactoryDefineOptions = {
  defaultData?: Resolver<TagFactoryDefineInput, BuildDataOptions>
}
export interface TagFactoryInterface {
  readonly _factoryFor: 'Tag'
  build(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>
  buildCreateInput(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.TagCreateInput>[]
  ): PromiseLike<Prisma.TagCreateInput[]>
  pickForConnect(inputData: Tag): Pick<Tag, 'id'>
  create(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Tag>
  createList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Tag[]>
  createForConnect(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Pick<Tag, 'id'>>
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export declare function defineTagFactory(options?: TagFactoryDefineOptions): TagFactoryInterface
declare type PollFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  opensAt?: Date
  closedAt?: Date | null
  question?: string | null
  infoText?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue
  answers?: Prisma.PollAnswerCreateNestedManyWithoutPollInput
  votes?: Prisma.PollVoteCreateNestedManyWithoutPollInput
  externalVoteSources?: Prisma.PollExternalVoteSourceCreateNestedManyWithoutPollInput
}
declare type PollFactoryDefineOptions = {
  defaultData?: Resolver<PollFactoryDefineInput, BuildDataOptions>
}
export interface PollFactoryInterface {
  readonly _factoryFor: 'Poll'
  build(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>
  buildCreateInput(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PollCreateInput>[]
  ): PromiseLike<Prisma.PollCreateInput[]>
  pickForConnect(inputData: Poll): Pick<Poll, 'id'>
  create(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Poll>
  createList(inputData: number | readonly Partial<Prisma.PollCreateInput>[]): PromiseLike<Poll[]>
  createForConnect(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Pick<Poll, 'id'>>
}
/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
export declare function definePollFactory(options?: PollFactoryDefineOptions): PollFactoryInterface
declare type PollAnswerpollFactory = {
  _factoryFor: 'Poll'
  build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutAnswersInput['create']>
}
declare type PollAnswerFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  answer?: string | null
  poll: PollAnswerpollFactory | Prisma.PollCreateNestedOneWithoutAnswersInput
  votes?: Prisma.PollVoteCreateNestedManyWithoutAnswerInput
  externalVotes?: Prisma.PollExternalVoteCreateNestedManyWithoutAnswerInput
}
declare type PollAnswerFactoryDefineOptions = {
  defaultData: Resolver<PollAnswerFactoryDefineInput, BuildDataOptions>
}
export interface PollAnswerFactoryInterface {
  readonly _factoryFor: 'PollAnswer'
  build(
    inputData?: Partial<Prisma.PollAnswerCreateInput>
  ): PromiseLike<Prisma.PollAnswerCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PollAnswerCreateInput>
  ): PromiseLike<Prisma.PollAnswerCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]
  ): PromiseLike<Prisma.PollAnswerCreateInput[]>
  pickForConnect(inputData: PollAnswer): Pick<PollAnswer, 'id'>
  create(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<PollAnswer>
  createList(
    inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]
  ): PromiseLike<PollAnswer[]>
  createForConnect(
    inputData?: Partial<Prisma.PollAnswerCreateInput>
  ): PromiseLike<Pick<PollAnswer, 'id'>>
}
/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
export declare function definePollAnswerFactory(
  options: PollAnswerFactoryDefineOptions
): PollAnswerFactoryInterface
declare type PollVoteuserFactory = {
  _factoryFor: 'User'
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPollVoteInput['create']>
}
declare type PollVoteanswerFactory = {
  _factoryFor: 'PollAnswer'
  build: () => PromiseLike<Prisma.PollAnswerCreateNestedOneWithoutVotesInput['create']>
}
declare type PollVotepollFactory = {
  _factoryFor: 'Poll'
  build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutVotesInput['create']>
}
declare type PollVoteFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  user?: PollVoteuserFactory | Prisma.UserCreateNestedOneWithoutPollVoteInput
  answer: PollVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutVotesInput
  poll: PollVotepollFactory | Prisma.PollCreateNestedOneWithoutVotesInput
  fingerprint?: string | null
  disabled?: boolean
}
declare type PollVoteFactoryDefineOptions = {
  defaultData: Resolver<PollVoteFactoryDefineInput, BuildDataOptions>
}
export interface PollVoteFactoryInterface {
  readonly _factoryFor: 'PollVote'
  build(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Prisma.PollVoteCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PollVoteCreateInput>
  ): PromiseLike<Prisma.PollVoteCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]
  ): PromiseLike<Prisma.PollVoteCreateInput[]>
  pickForConnect(inputData: PollVote): Pick<PollVote, 'id'>
  create(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<PollVote>
  createList(
    inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]
  ): PromiseLike<PollVote[]>
  createForConnect(
    inputData?: Partial<Prisma.PollVoteCreateInput>
  ): PromiseLike<Pick<PollVote, 'id'>>
}
/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
export declare function definePollVoteFactory(
  options: PollVoteFactoryDefineOptions
): PollVoteFactoryInterface
declare type PollExternalVoteSourcepollFactory = {
  _factoryFor: 'Poll'
  build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput['create']>
}
declare type PollExternalVoteSourceFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  poll:
    | PollExternalVoteSourcepollFactory
    | Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput
  source?: string | null
  voteAmounts?: Prisma.PollExternalVoteCreateNestedManyWithoutSourceInput
}
declare type PollExternalVoteSourceFactoryDefineOptions = {
  defaultData: Resolver<PollExternalVoteSourceFactoryDefineInput, BuildDataOptions>
}
export interface PollExternalVoteSourceFactoryInterface {
  readonly _factoryFor: 'PollExternalVoteSource'
  build(
    inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>
  ): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>
  ): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]
  ): PromiseLike<Prisma.PollExternalVoteSourceCreateInput[]>
  pickForConnect(inputData: PollExternalVoteSource): Pick<PollExternalVoteSource, 'id'>
  create(
    inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>
  ): PromiseLike<PollExternalVoteSource>
  createList(
    inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]
  ): PromiseLike<PollExternalVoteSource[]>
  createForConnect(
    inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>
  ): PromiseLike<Pick<PollExternalVoteSource, 'id'>>
}
/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
export declare function definePollExternalVoteSourceFactory(
  options: PollExternalVoteSourceFactoryDefineOptions
): PollExternalVoteSourceFactoryInterface
declare type PollExternalVoteanswerFactory = {
  _factoryFor: 'PollAnswer'
  build: () => PromiseLike<Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput['create']>
}
declare type PollExternalVotesourceFactory = {
  _factoryFor: 'PollExternalVoteSource'
  build: () => PromiseLike<
    Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput['create']
  >
}
declare type PollExternalVoteFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  answer: PollExternalVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput
  source:
    | PollExternalVotesourceFactory
    | Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput
  amount?: number
}
declare type PollExternalVoteFactoryDefineOptions = {
  defaultData: Resolver<PollExternalVoteFactoryDefineInput, BuildDataOptions>
}
export interface PollExternalVoteFactoryInterface {
  readonly _factoryFor: 'PollExternalVote'
  build(
    inputData?: Partial<Prisma.PollExternalVoteCreateInput>
  ): PromiseLike<Prisma.PollExternalVoteCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PollExternalVoteCreateInput>
  ): PromiseLike<Prisma.PollExternalVoteCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]
  ): PromiseLike<Prisma.PollExternalVoteCreateInput[]>
  pickForConnect(inputData: PollExternalVote): Pick<PollExternalVote, 'id'>
  create(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<PollExternalVote>
  createList(
    inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]
  ): PromiseLike<PollExternalVote[]>
  createForConnect(
    inputData?: Partial<Prisma.PollExternalVoteCreateInput>
  ): PromiseLike<Pick<PollExternalVote, 'id'>>
}
/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
export declare function definePollExternalVoteFactory(
  options: PollExternalVoteFactoryDefineOptions
): PollExternalVoteFactoryInterface
declare type EventimageFactory = {
  _factoryFor: 'Image'
  build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutEventsInput['create']>
}
declare type EventFactoryDefineInput = {
  id?: string
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  description?: Prisma.EventCreatedescriptionInput | Prisma.Enumerable<Prisma.InputJsonValue>
  status?: EventStatus
  image?: EventimageFactory | Prisma.ImageCreateNestedOneWithoutEventsInput
  location?: string | null
  startsAt?: Date
  endsAt?: Date | null
  tags?: Prisma.TaggedEventsCreateNestedManyWithoutEventInput
}
declare type EventFactoryDefineOptions = {
  defaultData?: Resolver<EventFactoryDefineInput, BuildDataOptions>
}
export interface EventFactoryInterface {
  readonly _factoryFor: 'Event'
  build(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Prisma.EventCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.EventCreateInput>
  ): PromiseLike<Prisma.EventCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.EventCreateInput>[]
  ): PromiseLike<Prisma.EventCreateInput[]>
  pickForConnect(inputData: Event): Pick<Event, 'id'>
  create(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Event>
  createList(inputData: number | readonly Partial<Prisma.EventCreateInput>[]): PromiseLike<Event[]>
  createForConnect(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Pick<Event, 'id'>>
}
/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
export declare function defineEventFactory(
  options?: EventFactoryDefineOptions
): EventFactoryInterface
declare type TaggedEventseventFactory = {
  _factoryFor: 'Event'
  build: () => PromiseLike<Prisma.EventCreateNestedOneWithoutTagsInput['create']>
}
declare type TaggedEventstagFactory = {
  _factoryFor: 'Tag'
  build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutEventsInput['create']>
}
declare type TaggedEventsFactoryDefineInput = {
  event: TaggedEventseventFactory | Prisma.EventCreateNestedOneWithoutTagsInput
  tag: TaggedEventstagFactory | Prisma.TagCreateNestedOneWithoutEventsInput
  createdAt?: Date
  modifiedAt?: Date
}
declare type TaggedEventsFactoryDefineOptions = {
  defaultData: Resolver<TaggedEventsFactoryDefineInput, BuildDataOptions>
}
export interface TaggedEventsFactoryInterface {
  readonly _factoryFor: 'TaggedEvents'
  build(
    inputData?: Partial<Prisma.TaggedEventsCreateInput>
  ): PromiseLike<Prisma.TaggedEventsCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.TaggedEventsCreateInput>
  ): PromiseLike<Prisma.TaggedEventsCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]
  ): PromiseLike<Prisma.TaggedEventsCreateInput[]>
  pickForConnect(inputData: TaggedEvents): Pick<TaggedEvents, 'eventId' | 'tagId'>
  create(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<TaggedEvents>
  createList(
    inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]
  ): PromiseLike<TaggedEvents[]>
  createForConnect(
    inputData?: Partial<Prisma.TaggedEventsCreateInput>
  ): PromiseLike<Pick<TaggedEvents, 'eventId' | 'tagId'>>
}
/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
export declare function defineTaggedEventsFactory(
  options: TaggedEventsFactoryDefineOptions
): TaggedEventsFactoryInterface
declare type UserFlowMailmailTemplateFactory = {
  _factoryFor: 'MailTemplate'
  build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutUserFlowMailsInput['create']>
}
declare type UserFlowMailFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  event?: UserEvent
  mailTemplate:
    | UserFlowMailmailTemplateFactory
    | Prisma.MailTemplateCreateNestedOneWithoutUserFlowMailsInput
}
declare type UserFlowMailFactoryDefineOptions = {
  defaultData: Resolver<UserFlowMailFactoryDefineInput, BuildDataOptions>
}
export interface UserFlowMailFactoryInterface {
  readonly _factoryFor: 'UserFlowMail'
  build(
    inputData?: Partial<Prisma.UserFlowMailCreateInput>
  ): PromiseLike<Prisma.UserFlowMailCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.UserFlowMailCreateInput>
  ): PromiseLike<Prisma.UserFlowMailCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.UserFlowMailCreateInput>[]
  ): PromiseLike<Prisma.UserFlowMailCreateInput[]>
  pickForConnect(inputData: UserFlowMail): Pick<UserFlowMail, 'id'>
  create(inputData?: Partial<Prisma.UserFlowMailCreateInput>): PromiseLike<UserFlowMail>
  createList(
    inputData: number | readonly Partial<Prisma.UserFlowMailCreateInput>[]
  ): PromiseLike<UserFlowMail[]>
  createForConnect(
    inputData?: Partial<Prisma.UserFlowMailCreateInput>
  ): PromiseLike<Pick<UserFlowMail, 'id'>>
}
/**
 * Define factory for {@link UserFlowMail} model.
 *
 * @param options
 * @returns factory {@link UserFlowMailFactoryInterface}
 */
export declare function defineUserFlowMailFactory(
  options: UserFlowMailFactoryDefineOptions
): UserFlowMailFactoryInterface
declare type SubscriptionFlowmemberPlanFactory = {
  _factoryFor: 'MemberPlan'
  build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput['create']>
}
declare type SubscriptionFlowFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  default?: boolean
  memberPlan?:
    | SubscriptionFlowmemberPlanFactory
    | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput
  paymentMethods?: Prisma.PaymentMethodCreateNestedManyWithoutSubscriptionFlowsInput
  periodicities?:
    | Prisma.SubscriptionFlowCreateperiodicitiesInput
    | Prisma.Enumerable<PaymentPeriodicity>
  autoRenewal?: Prisma.SubscriptionFlowCreateautoRenewalInput | Prisma.Enumerable<boolean>
  intervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutSubscriptionFlowInput
}
declare type SubscriptionFlowFactoryDefineOptions = {
  defaultData?: Resolver<SubscriptionFlowFactoryDefineInput, BuildDataOptions>
}
export interface SubscriptionFlowFactoryInterface {
  readonly _factoryFor: 'SubscriptionFlow'
  build(
    inputData?: Partial<Prisma.SubscriptionFlowCreateInput>
  ): PromiseLike<Prisma.SubscriptionFlowCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SubscriptionFlowCreateInput>
  ): PromiseLike<Prisma.SubscriptionFlowCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]
  ): PromiseLike<Prisma.SubscriptionFlowCreateInput[]>
  pickForConnect(inputData: SubscriptionFlow): Pick<SubscriptionFlow, 'id'>
  create(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<SubscriptionFlow>
  createList(
    inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]
  ): PromiseLike<SubscriptionFlow[]>
  createForConnect(
    inputData?: Partial<Prisma.SubscriptionFlowCreateInput>
  ): PromiseLike<Pick<SubscriptionFlow, 'id'>>
}
/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
export declare function defineSubscriptionFlowFactory(
  options?: SubscriptionFlowFactoryDefineOptions
): SubscriptionFlowFactoryInterface
declare type SubscriptionIntervalmailTemplateFactory = {
  _factoryFor: 'MailTemplate'
  build: () => PromiseLike<
    Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput['create']
  >
}
declare type SubscriptionIntervalsubscriptionFlowFactory = {
  _factoryFor: 'SubscriptionFlow'
  build: () => PromiseLike<Prisma.SubscriptionFlowCreateNestedOneWithoutIntervalsInput['create']>
}
declare type SubscriptionIntervalFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  event?: SubscriptionEvent
  daysAwayFromEnding?: number | null
  mailTemplate?:
    | SubscriptionIntervalmailTemplateFactory
    | Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput
  subscriptionFlow:
    | SubscriptionIntervalsubscriptionFlowFactory
    | Prisma.SubscriptionFlowCreateNestedOneWithoutIntervalsInput
}
declare type SubscriptionIntervalFactoryDefineOptions = {
  defaultData: Resolver<SubscriptionIntervalFactoryDefineInput, BuildDataOptions>
}
export interface SubscriptionIntervalFactoryInterface {
  readonly _factoryFor: 'SubscriptionInterval'
  build(
    inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>
  ): PromiseLike<Prisma.SubscriptionIntervalCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>
  ): PromiseLike<Prisma.SubscriptionIntervalCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]
  ): PromiseLike<Prisma.SubscriptionIntervalCreateInput[]>
  pickForConnect(inputData: SubscriptionInterval): Pick<SubscriptionInterval, 'id'>
  create(
    inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>
  ): PromiseLike<SubscriptionInterval>
  createList(
    inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]
  ): PromiseLike<SubscriptionInterval[]>
  createForConnect(
    inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>
  ): PromiseLike<Pick<SubscriptionInterval, 'id'>>
}
/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
export declare function defineSubscriptionIntervalFactory(
  options: SubscriptionIntervalFactoryDefineOptions
): SubscriptionIntervalFactoryInterface
declare type MailTemplateFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  name?: string
  description?: string | null
  externalMailTemplateId?: string
  remoteMissing?: boolean
  subscriptionIntervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutMailTemplateInput
  userFlowMails?: Prisma.UserFlowMailCreateNestedManyWithoutMailTemplateInput
  mailLog?: Prisma.MailLogCreateNestedManyWithoutMailTemplateInput
}
declare type MailTemplateFactoryDefineOptions = {
  defaultData?: Resolver<MailTemplateFactoryDefineInput, BuildDataOptions>
}
export interface MailTemplateFactoryInterface {
  readonly _factoryFor: 'MailTemplate'
  build(
    inputData?: Partial<Prisma.MailTemplateCreateInput>
  ): PromiseLike<Prisma.MailTemplateCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.MailTemplateCreateInput>
  ): PromiseLike<Prisma.MailTemplateCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]
  ): PromiseLike<Prisma.MailTemplateCreateInput[]>
  pickForConnect(inputData: MailTemplate): Pick<MailTemplate, 'id'>
  create(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<MailTemplate>
  createList(
    inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]
  ): PromiseLike<MailTemplate[]>
  createForConnect(
    inputData?: Partial<Prisma.MailTemplateCreateInput>
  ): PromiseLike<Pick<MailTemplate, 'id'>>
}
/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
export declare function defineMailTemplateFactory(
  options?: MailTemplateFactoryDefineOptions
): MailTemplateFactoryInterface
declare type PeriodicJobFactoryDefineInput = {
  createdAt?: Date
  modifiedAt?: Date
  date?: Date
  executionTime?: Date | null
  successfullyFinished?: Date | null
  finishedWithError?: Date | null
  tries?: number
  error?: string | null
}
declare type PeriodicJobFactoryDefineOptions = {
  defaultData?: Resolver<PeriodicJobFactoryDefineInput, BuildDataOptions>
}
export interface PeriodicJobFactoryInterface {
  readonly _factoryFor: 'PeriodicJob'
  build(
    inputData?: Partial<Prisma.PeriodicJobCreateInput>
  ): PromiseLike<Prisma.PeriodicJobCreateInput>
  buildCreateInput(
    inputData?: Partial<Prisma.PeriodicJobCreateInput>
  ): PromiseLike<Prisma.PeriodicJobCreateInput>
  buildList(
    inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]
  ): PromiseLike<Prisma.PeriodicJobCreateInput[]>
  pickForConnect(inputData: PeriodicJob): Pick<PeriodicJob, 'id'>
  create(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<PeriodicJob>
  createList(
    inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]
  ): PromiseLike<PeriodicJob[]>
  createForConnect(
    inputData?: Partial<Prisma.PeriodicJobCreateInput>
  ): PromiseLike<Pick<PeriodicJob, 'id'>>
}
/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
export declare function definePeriodicJobFactory(
  options?: PeriodicJobFactoryDefineOptions
): PeriodicJobFactoryInterface
