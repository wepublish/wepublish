import {ArgsType, Field, InputType, ObjectType, OmitType, PickType} from '@nestjs/graphql'
import {PaginatedType} from '@wepublish/api'
import {Article, ArticleFilter, ArticleListArgs, ArticleRevision} from '@wepublish/article/api'

@InputType()
export class PeerArticleFilter extends OmitType(
  ArticleFilter,
  ['draft', 'pending', 'published'] as const,
  InputType
) {
  @Field({nullable: true})
  peerName?: string
}

@ArgsType()
export class PeerArticleListArgs extends OmitType(
  ArticleListArgs,
  ['filter', 'cursorId'] as const,
  ArgsType
) {
  @Field(() => PeerArticleFilter, {nullable: true})
  filter?: PeerArticleFilter
}

@ObjectType()
export class PeerArticleRevision extends PickType(
  ArticleRevision,
  ['preTitle', 'title', 'image', 'lead'] as const,
  ObjectType
) {}

@ObjectType()
export class PeerArticle extends PickType(
  Article,
  ['id', 'slug', 'url', 'peerId', 'peer'] as const,
  ObjectType
) {
  @Field(() => PeerArticleRevision)
  latest!: PeerArticleRevision
}

@ObjectType()
export class PaginatedPeerArticle extends PaginatedType(PeerArticle) {}
