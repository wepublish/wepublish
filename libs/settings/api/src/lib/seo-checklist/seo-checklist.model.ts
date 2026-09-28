import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum SeoCheckKind {
  Automatic = 'automatic',
  Verifiable = 'verifiable',
  Manual = 'manual',
}

registerEnumType(SeoCheckKind, {
  name: 'SeoCheckKind',
});

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
  Robots = 'robots',
  RobotsSitemap = 'robotsSitemap',
  Sitemap = 'sitemap',
  NewsSitemap = 'newsSitemap',
  Canonical = 'canonical',
  StructuredData = 'structuredData',
  NoindexHidden = 'noindexHidden',
  PublicationMetadata = 'publicationMetadata',
  SearchConsole = 'searchConsole',
}

registerEnumType(SeoCheckId, {
  name: 'SeoCheckId',
});

@ObjectType()
export class SeoCheck {
  @Field(() => SeoCheckId)
  id!: SeoCheckId;

  @Field(() => SeoCheckKind)
  kind!: SeoCheckKind;

  @Field(() => SeoCheckStatus)
  status!: SeoCheckStatus;

  @Field({ nullable: true })
  detail?: string;

  @Field({ nullable: true })
  url?: string;
}

@ObjectType()
export class SeoChecklist {
  @Field()
  websiteUrl!: string;

  @Field()
  sitemapUrl!: string;

  @Field()
  robotsUrl!: string;

  @Field(() => [SeoCheck])
  checks!: SeoCheck[];
}
