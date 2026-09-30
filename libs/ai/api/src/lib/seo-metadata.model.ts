import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum SeoMetadataContentType {
  Article = 'article',
  Page = 'page',
}

registerEnumType(SeoMetadataContentType, {
  name: 'SeoMetadataContentType',
});

@InputType()
export class GenerateSeoMetadataInput {
  @Field(() => SeoMetadataContentType)
  type!: SeoMetadataContentType;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  lead?: string;

  @Field({ nullable: true })
  body?: string;
}

@ObjectType()
export class SeoMetadataSuggestion {
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
}
