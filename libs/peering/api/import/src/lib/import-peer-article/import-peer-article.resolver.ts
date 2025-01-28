import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {Article} from '@wepublish/article/api'
import {ImportPeerArticleService} from './import-peer-article.service'
import {PaginatedPeerArticle, PeerArticle, PeerArticleListArgs} from './peer-article.model'
import {Query} from '@nestjs/graphql'

@Resolver(() => PeerArticle)
export class ImportPeerArticleResolver {
  constructor(private importPeerArticleService: ImportPeerArticleService) {}

  @Query(() => PaginatedPeerArticle, {
    description: `Returns a paginated list of peer articles based on the filters given.`
  })
  public peerArticles(@Args() args: PeerArticleListArgs) {
    return this.importPeerArticleService.getArticles(args)
  }

  @Mutation(() => Article, {
    description: `Imports an article from a peer as a draft.`
  })
  public importPeerArticle(@Args('peerId') peerId: string, @Args('articleId') articleId: string) {
    return this.importPeerArticleService.importArticle(peerId, articleId)
  }
}
