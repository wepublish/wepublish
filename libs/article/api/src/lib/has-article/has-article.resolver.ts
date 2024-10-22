import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasArticle} from './has-article.model'
import {Article} from '../article.model'
import {ArticleDataloaderService} from '../article-dataloader.service'

@Resolver(HasArticle)
export class HasArticleResolver {
  constructor(private dataloader: ArticleDataloaderService) {}

  @ResolveField(() => Article, {nullable: true})
  public article(@Parent() block: HasArticle) {
    const {articleID} = block

    if (!articleID) {
      return null
    }

    return this.dataloader.load(articleID)
  }
}
