import { ArgsType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum SeoCheckStatus {
  Ok = 'ok',
  Warning = 'warning',
  Error = 'error',
  Info = 'info',
}

registerEnumType(SeoCheckStatus, {
  name: 'SeoCheckStatus',
});

export enum SeoCheckId {
  Sitemap = 'sitemap',
  NewsSitemap = 'newsSitemap',
  Feed = 'feed',
  ArticleMarkup = 'articleMarkup',
  PublicationMetadata = 'publicationMetadata',
}

registerEnumType(SeoCheckId, {
  name: 'SeoCheckId',
});

@ObjectType()
export class SeoCheck {
  @Field(() => SeoCheckId)
  id!: SeoCheckId;

  @Field(() => SeoCheckStatus)
  status!: SeoCheckStatus;

  @Field({ nullable: true })
  detail?: string;

  @Field({ nullable: true })
  url?: string;
}

@ObjectType()
export class SeoChecklistItem {
  @Field()
  itemId!: string;

  @Field()
  completedAt!: Date;

  @Field({ nullable: true })
  completedBy?: string;
}

@ObjectType()
export class SeoChecklist {
  @Field()
  websiteUrl!: string;

  @Field()
  sitemapUrl!: string;

  @Field()
  rssFeedUrl!: string;

  @Field()
  atomFeedUrl!: string;

  @Field()
  jsonFeedUrl!: string;

  @Field(() => [SeoCheck])
  checks!: SeoCheck[];

  @Field(() => [SeoChecklistItem])
  completedItems!: SeoChecklistItem[];
}

@ArgsType()
export class UpdateSeoChecklistItemArgs {
  @Field()
  itemId!: string;

  @Field()
  completed!: boolean;
}
