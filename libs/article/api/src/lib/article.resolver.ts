import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {ArticleDataloaderService} from './article-dataloader.service'
import {
  Article,
  ArticleListArgs,
  ArticleRevision,
  CreateArticleInput,
  PaginatedArticles,
  UpdateArticleInput
} from './article.model'
import {Tag} from '@wepublish/tag/api'
import {ArticleService} from './article.service'
import {ArticleRevisionDataloaderService} from './article-revision-dataloader.service'
import {URLAdapter} from '@wepublish/nest-modules'
import {Article as PArticle} from '@prisma/client'
import {BadRequestException} from '@nestjs/common'
import {
  Permissions,
  CanCreateArticle,
  CanDeleteArticle,
  CanPublishArticle,
  hasPermission,
  CanGetArticle
} from '@wepublish/permissions/api'
import {CurrentUser, Public, UserSession} from '@wepublish/authentication/api'
import {TrackingPixelService} from '@wepublish/tracking-pixel/api'

@Resolver(() => Article)
export class ArticleResolver {
  constructor(
    private articleDataloader: ArticleDataloaderService,
    private articleRevisionsDataloader: ArticleRevisionDataloaderService,
    private articleService: ArticleService,
    private trackingPixelService: TrackingPixelService,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Article, {description: `Returns an article by id or slug.`})
  public async article(
    @Args('id', {nullable: true}) id?: string,
    @Args('slug', {nullable: true}) slug?: string
  ) {
    if (id != null) {
      const article = await this.articleDataloader.load(id)

      if (!article?.peerId) {
        await this.trackingPixelService.addMissingArticleTrackingPixels(id)
      }

      return article
    }

    if (slug != null) {
      return this.articleService.getArticleBySlug(slug)
    }

    throw new BadRequestException('id or slug required.')
  }

  @Public()
  @Query(() => PaginatedArticles, {
    description: `Returns a paginated list of articles based on the filters given.`
  })
  public articles(@Args() args: ArticleListArgs, @CurrentUser() user: UserSession | undefined) {
    if (!hasPermission(CanGetArticle, user?.roles ?? [])) {
      args.filter = {
        ...args.filter,
        draft: undefined,
        pending: undefined,
        published: true
      }
    }

    return this.articleService.getArticles(args)
  }

  @Permissions(CanCreateArticle)
  @Mutation(() => Article, {
    description: `Creates an article.`
  })
  public createArticle(
    @Args() input: CreateArticleInput,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.articleService.createArticle(input, user?.user?.id)
  }

  @Permissions(CanCreateArticle)
  @Mutation(() => Article, {
    description: `Updates an article.`
  })
  public updateArticle(
    @Args() input: UpdateArticleInput,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.articleService.updateArticle(input, user?.user?.id)
  }

  @Permissions(CanCreateArticle)
  @Mutation(() => Article, {
    description: `Duplicates an article.`
  })
  public duplicateArticle(@Args('id') id: string, @CurrentUser() user: UserSession | undefined) {
    return this.articleService.duplicateArticle(id, user?.user?.id)
  }

  @Permissions(CanDeleteArticle)
  @Mutation(() => String, {
    description: `Deletes an article.`
  })
  public async deleteArticle(@Args('id') id: string) {
    return (await this.articleService.deleteArticle(id)).id
  }

  @Permissions(CanPublishArticle)
  @Mutation(() => Article, {
    description: `Publishes an article at the given time.`
  })
  public publishArticle(@Args('id') id: string, @Args('publishedAt') publishedAt: Date) {
    return this.articleService.publishArticle(id, publishedAt)
  }

  @Permissions(CanPublishArticle)
  @Mutation(() => Article, {
    description: `Unpublishes all revisions of an article.`
  })
  public unpublishArticle(@Args('id') id: string) {
    return this.articleService.unpublishArticle(id)
  }

  @Public()
  @Mutation(() => Article, {
    description: `Likes an article.`
  })
  public likeArticle(@Args('id') id: string) {
    return this.articleService.likeArticle(id)
  }

  @Public()
  @Mutation(() => Article, {
    description: `Dislikes an article.`
  })
  public dislikeArticle(@Args('id') id: string) {
    return this.articleService.dislikeArticle(id)
  }

  @ResolveField(() => ArticleRevision)
  async latest(@Parent() parent: PArticle, @CurrentUser() user: UserSession | undefined) {
    const {id: articleId} = parent
    const {draft, pending, published} = await this.articleRevisionsDataloader.load(articleId)

    if (!hasPermission(CanGetArticle, user?.roles ?? [])) {
      return published
    }

    // @TODO: Only show all when preview enabled
    return draft ?? pending ?? published
  }

  @Permissions(CanGetArticle)
  @ResolveField(() => ArticleRevision, {nullable: true})
  async draft(@Parent() parent: PArticle) {
    const {id: articleId} = parent
    const {draft} = await this.articleRevisionsDataloader.load(articleId)

    return draft
  }

  @Permissions(CanGetArticle)
  @ResolveField(() => ArticleRevision, {nullable: true})
  async pending(@Parent() parent: PArticle) {
    const {id: articleId} = parent
    const {pending} = await this.articleRevisionsDataloader.load(articleId)

    return pending
  }

  @ResolveField(() => ArticleRevision, {nullable: true})
  async published(@Parent() parent: PArticle) {
    const {id: articleId} = parent
    const {published} = await this.articleRevisionsDataloader.load(articleId)

    return published
  }

  @ResolveField(() => String, {nullable: true})
  async url(@Parent() parent: PArticle) {
    return this.urlAdapter.getArticleUrl(parent)
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: PArticle) {
    const {id: articleId} = parent
    const tagIds = await this.articleService.getTagIds(articleId)

    return tagIds.map(({id}) => ({__typename: 'Tag', id}))
  }

  @ResolveField(() => String, {nullable: true})
  async trackingPixels(@Parent() {id}: PArticle) {
    return this.articleService.getTrackingPixels(id)
  }
}
