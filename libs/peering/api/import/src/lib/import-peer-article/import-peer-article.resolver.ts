import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {Article} from '@wepublish/article/api'
import {ImportPeerArticleService} from './import-peer-article.service'

@Resolver()
export class ImportPeerArticleResolver {
  constructor(private importPeerArticleService: ImportPeerArticleService) {}

  @Mutation(() => Article, {
    description: `Imports an article from a peer as a draft.`
  })
  public publishArticle(@Args('peerId') peerId: string, @Args('articleId') articleId: string) {
    return this.importPeerArticleService.importArticle(peerId, articleId)
  }
}
