import { Field, InterfaceType } from '@nestjs/graphql';
import { Article } from '../article.model';

@InterfaceType()
export abstract class HasOptionalArticle {
  @Field({ nullable: true })
  articleID?: string;

  @Field(() => Article, { nullable: true })
  article?: Article;
}

@InterfaceType()
export abstract class HasArticle {
  @Field()
  articleID!: string;

  @Field(() => Article)
  article!: Article;
}

// New Style

@InterfaceType()
export abstract class HasArticleLc {
  @Field()
  articleId!: string;

  @Field(() => Article)
  article!: Article;
}

@InterfaceType()
export abstract class HasOptionalArticleLc {
  @Field({ nullable: true })
  articleId?: string;

  @Field(() => Article, { nullable: true })
  article?: Article;
}
