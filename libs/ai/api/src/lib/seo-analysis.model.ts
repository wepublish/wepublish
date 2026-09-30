import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GenerateSeoMetadataInput } from './seo-metadata.model';

export enum SeoFindingSeverity {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

registerEnumType(SeoFindingSeverity, {
  name: 'SeoFindingSeverity',
});

export enum SeoFindingCategory {
  Title = 'title',
  Description = 'description',
  Content = 'content',
  Structure = 'structure',
  Readability = 'readability',
  Links = 'links',
  Images = 'images',
  Social = 'social',
}

registerEnumType(SeoFindingCategory, {
  name: 'SeoFindingCategory',
});

@InputType()
export class SeoContentStatsInput {
  @Field(() => Int)
  wordCount!: number;

  @Field(() => Int)
  headingCount!: number;

  @Field(() => Int)
  linkCount!: number;

  @Field(() => Int)
  imageCount!: number;

  @Field(() => Int)
  imagesWithoutDescription!: number;

  @Field()
  hasShareImage!: boolean;
}

@InputType()
export class AnalyzeSeoContentInput extends GenerateSeoMetadataInput {
  @Field({ nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  seoDescription?: string;

  @Field({ nullable: true })
  socialMediaTitle?: string;

  @Field({ nullable: true })
  socialMediaDescription?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({
    description: 'Language the findings should be written in, e.g. "de".',
  })
  locale!: string;

  @Field(() => SeoContentStatsInput)
  stats!: SeoContentStatsInput;
}

@ObjectType()
export class SeoFinding {
  @Field(() => SeoFindingSeverity)
  severity!: SeoFindingSeverity;

  @Field(() => SeoFindingCategory)
  category!: SeoFindingCategory;

  @Field()
  message!: string;

  @Field({ nullable: true })
  suggestion?: string;
}

@ObjectType()
export class SeoContentAnalysis {
  @Field()
  summary!: string;

  @Field(() => [SeoFinding])
  findings!: SeoFinding[];
}
