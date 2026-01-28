import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { PaginatedType } from '@wepublish/utils/api';
import {
  Article,
  ArticleFilter,
  ArticleListArgs,
  ArticleRevision,
} from '@wepublish/article/api';
import { HasOptionalPeerLc, Peer } from '@wepublish/peering/api';
import { PeerImage } from '@wepublish/image/api';

@InputType()
export class PeerArticleFilter extends OmitType(
  ArticleFilter,
  [
    'draft',
    'pending',
    'published',
    'includeHidden',
    'shared',
    'tagsNotIn',
  ] as const,
  InputType
) {
  @Field({ nullable: true })
  override peerId?: string;
}

@ArgsType()
export class PeerArticleListArgs extends OmitType(
  ArticleListArgs,
  ['filter', 'cursorId'] as const,
  ArgsType
) {
  @Field(() => PeerArticleFilter, { nullable: true })
  filter?: PeerArticleFilter;
}

@ObjectType()
export class PeerArticleRevision extends PickType(
  ArticleRevision,
  ['id', 'preTitle', 'title', 'seoTitle', 'lead'] as const,
  ObjectType
) {
  @Field(() => PeerImage, { nullable: true })
  image?: PeerImage;
}

@ObjectType({
  implements: () => [HasOptionalPeerLc],
})
export class PeerArticle
  extends PickType(
    Article,
    ['id', 'publishedAt', 'createdAt', 'modifiedAt', 'slug', 'url'] as const,
    ObjectType
  )
  implements HasOptionalPeerLc
{
  @Field(() => PeerArticleRevision)
  latest!: PeerArticleRevision;

  @Field()
  override publishedAt!: Date;

  peerId?: string;
  peer?: Peer;
}

@ObjectType()
export class PaginatedPeerArticle extends PaginatedType(PeerArticle) {}

@InputType()
export class ImportArticleOptions {
  @Field({ nullable: true })
  importAuthors?: boolean;

  @Field({ nullable: true })
  importTags?: boolean;

  @Field({ nullable: true })
  importContentImages?: boolean;
}
