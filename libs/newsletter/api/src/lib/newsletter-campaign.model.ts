import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { Image } from '@wepublish/image/api';
import type { NewsletterDocument } from '@wepublish/newsletter/email';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class NewsletterCampaign {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  title!: string;

  @Field(() => GraphQLJSONObject)
  document!: NewsletterDocument;

  @Field(() => Int)
  blockCount!: number;

  @Field({ nullable: true })
  mailchimpCampaignId?: string;

  @Field(() => Int, { nullable: true })
  mailchimpCampaignWebId?: number;

  @Field({ nullable: true })
  mailchimpEditUrl?: string;

  @Field(() => [Image])
  images!: Image[];
}

@ObjectType()
export class NewsletterReport {
  @Field(() => Int)
  bytes!: number;

  @Field(() => [String])
  missingFooter!: string[];

  @Field(() => [String])
  missingArticles!: string[];
}

@ObjectType()
export class MailchimpDraft {
  @Field()
  id!: string;

  @Field(() => Int)
  webId!: number;

  @Field()
  title!: string;

  @Field()
  editUrl!: string;
}

@ObjectType()
export class NewsletterPublishResult {
  @Field(() => MailchimpDraft)
  campaign!: MailchimpDraft;

  @Field()
  created!: boolean;

  @Field(() => NewsletterReport)
  report!: NewsletterReport;
}

@ObjectType()
export class NewsletterMergeTag {
  @Field()
  tag!: string;

  @Field()
  label!: string;

  @Field()
  description!: string;

  @Field({ nullable: true })
  kind?: string;
}

@ObjectType()
export class NewsletterInterestCategory {
  @Field()
  title!: string;

  @Field(() => [String])
  groups!: string[];
}

@ObjectType()
export class NewsletterMergeFields {
  @Field(() => [NewsletterMergeTag])
  fields!: NewsletterMergeTag[];

  @Field(() => [NewsletterInterestCategory])
  interests!: NewsletterInterestCategory[];

  @Field({ nullable: true })
  error?: string;
}

@ArgsType()
export class CreateNewsletterCampaignArgs {
  @Field()
  title!: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  document?: Record<string, unknown>;
}

@ArgsType()
export class UpdateNewsletterCampaignArgs {
  @Field()
  id!: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => GraphQLJSONObject)
  document!: Record<string, unknown>;
}
