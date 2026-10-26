import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { EngagementRequirement } from '@prisma/client';
import {
  EngagementPrompt,
  NewsletterParamInput,
} from '@wepublish/engagement/api';
import { ArticleAccessSource } from './article-access';
import { Article } from './article.model';

registerEnumType(ArticleAccessSource, {
  name: 'ArticleAccessSource',
  description: `What keeps a reader from the full article: a paywall or a metered engagement rule.`,
});

@ObjectType()
export class ArticleAccess {
  @Field()
  granted!: boolean;

  @Field(() => ArticleAccessSource, { nullable: true })
  source?: ArticleAccessSource;

  @Field(() => EngagementRequirement, { nullable: true })
  requirement?: EngagementRequirement;

  @Field(() => Int, { nullable: true })
  previewBlocks?: number;

  @Field({ nullable: true })
  paywallId?: string;

  @Field({ nullable: true })
  ruleId?: string;

  @Field({ nullable: true })
  stageId?: string;
}

@InputType()
export class ViewArticleInput {
  @Field()
  articleId!: string;

  @Field({
    nullable: true,
    description: `The meterToken the last viewArticle answered, for anonymous readers.`,
  })
  meterToken?: string;

  @Field(() => [NewsletterParamInput], {
    nullable: true,
    description: `The url params of the current page, for newsletter referrals. Only open the article they link to.`,
  })
  referral?: NewsletterParamInput[];

  @Field({ nullable: true })
  paywallBypassToken?: string;
}

@ObjectType()
export class ArticleView {
  @Field(() => String, {
    nullable: true,
    description: `The anonymous reader's meter, signed. Keep it and send it with the next viewArticle. Null for logged-in readers, whose meter stays on the server.`,
  })
  meterToken?: string | null;

  @Field(() => ArticleAccess)
  access!: ArticleAccess;

  @Field(() => [EngagementPrompt])
  prompts!: EngagementPrompt[];

  @Field(() => Article, {
    description: `The article, with every block when access was granted.`,
  })
  article!: Article;
}
