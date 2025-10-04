import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasArticle,
  HasArticleLc,
  HasOptionalArticle,
  HasOptionalArticleLc,
} from './has-article.model';
import { Article } from '../article.model';
import { ArticleDataloaderService } from '../article-dataloader.service';

@Resolver(() => HasArticle)
export class HasArticleResolver {
  constructor(private dataloader: ArticleDataloaderService) {}

  @ResolveField(() => Article, { nullable: true })
  public article(
    @Parent()
    block: HasOptionalArticle | HasArticle | HasOptionalArticleLc | HasArticleLc
  ) {
    const id =
      'articleId' in block ? block.articleId
      : 'articleID' in block ? block.articleID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasArticleLc)
export class HasArticleLcResolver extends HasArticleResolver {}

@Resolver(() => HasOptionalArticle)
export class HasOptionalArticleResolver extends HasArticleResolver {}

@Resolver(() => HasOptionalArticleLc)
export class HasOptionalArticleLcResolver extends HasArticleResolver {}
