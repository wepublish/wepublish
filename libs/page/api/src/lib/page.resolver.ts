import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {PageService} from './page.service'
import {
  Page,
  PaginatedPages,
  PaginatedPublishedPages,
  CreatePageArgs,
  UpdatePageArgs,
  DeletePageArgs,
  GetPageArgs,
  GetPagesArgs,
  GetPublishedPagesArgs,
  PublishPageArgs
} from './page.model'
import {Permissions} from '@wepublish/permissions/api'
import {
  CanCreatePage,
  CanDeletePage,
  CanPublishPage,
  CanGetPage,
  CanGetPages
} from '@wepublish/permissions/api'
import {PageDataloader} from './page.dataloader'

@Resolver(() => Page)
export class PageResolver {
  constructor(
    private readonly pageService: PageService,
    private readonly pageDataloader: PageDataloader
  ) {}

  @Query(() => PaginatedPublishedPages)
  getPublishedPages(@Args() args: GetPublishedPagesArgs) {
    return this.pageService.getPublishedPages(args)
  }

  @Query(() => PaginatedPages)
  @Permissions(CanGetPages)
  getPages(@Args() args: GetPagesArgs) {
    return this.pageService.getPages(args)
  }

  @Query(() => Page)
  @Permissions(CanGetPage)
  getPage(@Args() args: GetPageArgs) {
    return this.pageDataloader.load(args.id)
  }

  @Mutation(() => Page)
  @Permissions(CanCreatePage)
  createPage(@Args() {page}: CreatePageArgs) {
    return this.pageService.createPage(page)
  }

  @Mutation(() => Page)
  @Permissions(CanGetPage)
  duplicatePage(@Args() args: GetPageArgs) {
    return this.pageService.duplicatePage(args.id)
  }

  @Mutation(() => Page)
  @Permissions(CanCreatePage)
  updatePage(@Args() {id, page}: UpdatePageArgs) {
    return this.pageService.updatePage(id, page)
  }

  @Mutation(() => Page)
  @Permissions(CanPublishPage)
  publishPage(@Args() {id, input}: PublishPageArgs) {
    return this.pageService.publishPage(id, input)
  }

  @Mutation(() => Page)
  @Permissions(CanPublishPage)
  unpublishPage(@Args() args: GetPageArgs) {
    return this.pageService.unpublishPage(args.id)
  }

  @Mutation(() => Page)
  @Permissions(CanDeletePage)
  deletePage(@Args() args: DeletePageArgs) {
    return this.pageService.deletePage(args.id)
  }
}
