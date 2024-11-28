import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {ArticleDataloaderService} from './article-dataloader.service'
import {
  Article,
  ArticleListArgs,
  ArticleRevision,
  PaginatedArticles,
  UpdateArticleInput
} from './article.model'
import {Tag} from '@wepublish/tag/api'
import {ArticleService} from './article.service'
import {ArticleRevisionDataloaderService} from './article-revision-dataloader.service'

@Resolver(() => Article)
export class ArticleResolver {
  constructor(
    private articleDataloader: ArticleDataloaderService,
    private articleRevisionsDataloader: ArticleRevisionDataloaderService,
    private articleService: ArticleService
  ) {}

  @Query(() => Article, {description: `Returns an article by id.`})
  public article(@Args('id') id: string) {
    return this.articleDataloader.load(id)
  }

  @Query(() => PaginatedArticles, {
    description: `Returns a paginated list of articles based on the filters given.`
  })
  public articles(@Args() filter: ArticleListArgs) {
    return this.articleService.getArticles(filter)
  }

  @Mutation(() => Article, {
    description: `Updates an article.`
  })
  public updateArticle(@Args() input: UpdateArticleInput) {
    return this.articleService.updateArticle(input)
  }

  @Mutation(() => Article, {
    description: `Publishes an article at the given time.`
  })
  public publishArticle(@Args('id') id: string, @Args('publishedAt') publishedAt: Date) {
    return this.articleService.publishArticle(id, publishedAt)
  }

  @Mutation(() => Article, {
    description: `Unpublishes all revisions of an article.`
  })
  public unpublishArticle(@Args('id') id: string) {
    return this.articleService.unpublishArticle(id)
  }

  @Mutation(() => Article, {
    description: `Imports an article from a given peer.`
  })
  public importArticle(
    @Args('peerId') peerId: string,
    @Args('peerArticleId') peerArticleId: string
  ) {}

  @ResolveField(() => ArticleRevision, {nullable: true})
  async draft(@Parent() parent: Article) {
    const {id: articleId} = parent
    const {draft} = await this.articleRevisionsDataloader.load(articleId)

    return draft
  }

  @ResolveField(() => ArticleRevision, {nullable: true})
  async pending(@Parent() parent: Article) {
    const {id: articleId} = parent
    const {pending} = await this.articleRevisionsDataloader.load(articleId)

    return pending
  }

  @ResolveField(() => ArticleRevision, {nullable: true})
  async published(@Parent() parent: Article) {
    const {id: articleId} = parent
    const {published} = await this.articleRevisionsDataloader.load(articleId)

    return published
  }

  @ResolveField(() => String, {nullable: true})
  async url(@Parent() parent: Article) {
    // @TODO: implement
    return ''
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: Article) {
    const {id: articleId} = parent
    const tagIds = await this.articleService.getTagIds(articleId)

    return tagIds.map(({id}) => ({__typename: 'Tag', id}))
  }
}
