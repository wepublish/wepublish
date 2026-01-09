import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Article } from '@wepublish/article/api';
import { ImportPeerArticleService } from './import-peer-article.service';
import {
  ImportArticleOptions,
  PaginatedPeerArticles,
  PeerArticle,
  PeerArticleListArgs,
} from './peer-article.model';
import { CanGetPeerArticles } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => PeerArticle)
export class ImportPeerArticleResolver {
  constructor(private importPeerArticleService: ImportPeerArticleService) {}

  @Permissions(CanGetPeerArticles)
  @Query(() => PaginatedPeerArticles, {
    description: `Returns a paginated list of peer articles based on the filters given.`,
  })
  public peerArticles(@Args() args: PeerArticleListArgs) {
    return this.importPeerArticleService.getArticles(args);
  }

  @Permissions(CanGetPeerArticles)
  @Mutation(() => Article, {
    description: `Imports an article from a peer as a draft.`,
  })
  public importPeerArticle(
    @Args('peerId') peerId: string,
    @Args('articleId') articleId: string,
    @Args('options', {
      defaultValue: {
        importContentImages: true,
        importAuthors: true,
        importTags: true,
      } as ImportArticleOptions,
    })
    options: ImportArticleOptions
  ) {
    return this.importPeerArticleService.importArticle(
      peerId,
      articleId,
      options
    );
  }
}
