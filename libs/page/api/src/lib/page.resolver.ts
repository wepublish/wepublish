import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {PageDataloaderService} from './page-dataloader.service'
import {Page, PageListArgs, PageRevision, PaginatedPages, UpdatePageInput} from './page.model'
import {Tag} from '@wepublish/tag/api'
import {PageService} from './page.service'
import {PageRevisionDataloaderService} from './page-revision-dataloader.service'
import {URLAdapter} from '@wepublish/nest-modules'
import {Page as PPage} from '@prisma/client'
import {BadRequestException} from '@nestjs/common'

@Resolver(() => Page)
export class PageResolver {
  constructor(
    private pageDataloader: PageDataloaderService,
    private pageRevisionsDataloader: PageRevisionDataloaderService,
    private pageService: PageService,
    private urlAdapter: URLAdapter
  ) {}

  @Query(() => Page, {description: `Returns a page by id or slug.`})
  public page(
    @Args('id', {nullable: true}) id?: string,
    @Args('slug', {nullable: true}) slug?: string
  ) {
    if (id != null) {
      return this.pageDataloader.load(id)
    }

    if (slug != null) {
      return this.pageService.getPageBySlug(slug)
    }

    throw new BadRequestException('id or slug required.')
  }

  @Query(() => PaginatedPages, {
    description: `Returns a paginated list of pages based on the filters given.`
  })
  public pages(@Args() filter: PageListArgs) {
    return this.pageService.getPages(filter)
  }

  @Mutation(() => Page, {
    description: `Updates an page.`
  })
  public updatePage(@Args() input: UpdatePageInput) {
    return this.pageService.updatePage(input)
  }

  @Mutation(() => Page, {
    description: `Publishes an page at the given time.`
  })
  public publishPage(@Args('id') id: string, @Args('publishedAt') publishedAt: Date) {
    return this.pageService.publishPage(id, publishedAt)
  }

  @Mutation(() => Page, {
    description: `Unpublishes all revisions of an page.`
  })
  public unpublishPage(@Args('id') id: string) {
    return this.pageService.unpublishPage(id)
  }

  @ResolveField(() => PageRevision, {nullable: true})
  async draft(@Parent() parent: PPage) {
    const {id: pageId} = parent
    const {draft} = await this.pageRevisionsDataloader.load(pageId)

    return draft
  }

  @ResolveField(() => PageRevision, {nullable: true})
  async pending(@Parent() parent: PPage) {
    const {id: pageId} = parent
    const {pending} = await this.pageRevisionsDataloader.load(pageId)

    return pending
  }

  @ResolveField(() => PageRevision, {nullable: true})
  async published(@Parent() parent: PPage) {
    const {id: pageId} = parent
    const {published} = await this.pageRevisionsDataloader.load(pageId)

    return published
  }

  @ResolveField(() => String, {nullable: true})
  async url(@Parent() parent: PPage) {
    return this.urlAdapter.getPageUrl(parent)
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: PPage) {
    const {id: pageId} = parent
    const tagIds = await this.pageService.getTagIds(pageId)

    return tagIds.map(({id}) => ({__typename: 'Tag', id}))
  }
}
