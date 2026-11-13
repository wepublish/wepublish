import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { ArticleAccessService, ArticleRequest } from './article-access.service';
import { ArticleView, ViewArticleInput } from './view-article.model';

@Resolver(() => ArticleView)
export class ViewArticleResolver {
  constructor(private articleAccess: ArticleAccessService) {}

  @Public()
  @Mutation(() => ArticleView, {
    description: `Records that the reader opens an article and decides their access: the only way past a hard engagement stage or an enforced paywall. A mutation on purpose, so it is never cached or prefetched.`,
  })
  viewArticle(
    @Args('input') input: ViewArticleInput,
    @Context('req') req: ArticleRequest,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.articleAccess.view({ ...input, req, session });
  }
}
