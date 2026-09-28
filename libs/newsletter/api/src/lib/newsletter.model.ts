import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import type { NewsletterDocument } from '@wepublish/newsletter';
import { PaginatedType } from '@wepublish/utils/api';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class NewsletterArticle {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  preTitle!: string | null;

  @Field(() => String, { nullable: true })
  lead!: string | null;

  @Field()
  url!: string;

  @Field(() => String, {
    nullable: true,
    description: 'JPEG variant sized for the teaser column, for mail clients.',
  })
  imageUrl!: string | null;

  @Field(() => Date, { nullable: true })
  publishedAt!: Date | null;

  @Field(() => [String])
  tags!: string[];
}

@ObjectType()
export class NewsletterImage {
  @Field()
  id!: string;

  @Field({ description: 'JPEG variant sized for the widest column it fills.' })
  url!: string;
}

@ObjectType()
export class Newsletter {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  title!: string;

  @Field(() => GraphQLJSONObject, {
    description: 'The block document; see @wepublish/newsletter for its shape.',
  })
  document!: NewsletterDocument;

  @Field(() => Int)
  blockCount!: number;

  @Field(() => String, { nullable: true })
  mailchimpCampaignId?: string | null;

  @Field(() => Int, { nullable: true })
  mailchimpCampaignWebId?: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Link to the draft in the Mailchimp admin, once published.',
  })
  mailchimpEditUrl?: string | null;

  @Field(() => [NewsletterArticle], {
    description: 'The articles the document teases, as the mail renders them.',
  })
  teaserArticles!: NewsletterArticle[];

  @Field(() => [NewsletterImage], {
    description: 'The CMS images the document references.',
  })
  images!: NewsletterImage[];
}

@ObjectType()
export class PaginatedNewsletters extends PaginatedType(Newsletter) {}

@ArgsType()
export class NewsletterListArgs {
  @Field(() => Int, { defaultValue: 50 })
  take?: number;

  @Field(() => Int, { defaultValue: 0 })
  skip?: number;
}

@InputType()
export class CreateNewsletterInput {
  @Field()
  title!: string;

  @Field(() => String, {
    nullable: true,
    description:
      'Start from a copy of this newsletter document instead of the built-in default.',
  })
  fromNewsletterId?: string | null;

  @Field(() => GraphQLJSONObject, { nullable: true })
  document?: NewsletterDocument | null;
}

@InputType()
export class UpdateNewsletterInput extends PartialType(
  PickType(CreateNewsletterInput, ['title', 'document'] as const),
  InputType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class NewsletterArticlesArgs {
  @Field(() => Int, {
    defaultValue: 90,
    description: 'How many days back the article list reaches.',
  })
  days?: number;

  @Field(() => Int, { defaultValue: 500 })
  take?: number;
}

@ObjectType()
export class NewsletterReport {
  @Field(() => Int, { description: 'UTF-8 bytes of the rendered HTML.' })
  bytes!: number;

  @Field(() => [String], {
    description: 'Required footer tags the HTML lacks: unsubscribe, address.',
  })
  missingFooter!: string[];

  @Field(() => [String])
  missingArticles!: string[];

  @Field(() => [String])
  missingImages!: string[];
}

@ObjectType()
export class NewsletterPreview {
  @Field()
  html!: string;

  @Field(() => NewsletterReport)
  report!: NewsletterReport;
}

@ObjectType()
export class NewsletterCampaign {
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
  @Field(() => NewsletterCampaign)
  campaign!: NewsletterCampaign;

  @Field({
    description: 'Whether a new draft was created rather than updated.',
  })
  created!: boolean;

  @Field(() => NewsletterReport)
  report!: NewsletterReport;
}

@ObjectType()
export class NewsletterMergeField {
  @Field()
  tag!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class NewsletterInterestCategory {
  @Field()
  title!: string;

  @Field(() => [String])
  groups!: string[];
}

@ObjectType()
export class NewsletterMergeFieldCatalogue {
  @Field(() => [NewsletterMergeField])
  fields!: NewsletterMergeField[];

  @Field(() => [NewsletterInterestCategory])
  interests!: NewsletterInterestCategory[];

  @Field(() => String, {
    nullable: true,
    description: 'Why the fields or the groups could not be loaded, if so.',
  })
  error?: string | null;
}
