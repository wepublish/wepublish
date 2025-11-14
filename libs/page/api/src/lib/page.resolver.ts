import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PageDataloaderService } from './page-dataloader.service';
import {
  CreatePageInput,
  Page,
  PageListArgs,
  PageRevision,
  PaginatedPages,
  UpdatePageInput,
} from './page.model';
import { PageTagDataloader, Tag } from '@wepublish/tag/api';
import { PageService } from './page.service';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
import { URLAdapter } from '@wepublish/nest-modules';
import { Page as PPage } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import {
  CanCreatePage,
  CanDeletePage,
  CanGetPage,
  CanPublishPage,
} from '@wepublish/permissions';
import { Permissions, PreviewMode } from '@wepublish/permissions/api';

@Resolver(() => Page)
export class PageResolver {
  constructor(
    private pageDataloader: PageDataloaderService,
    private pageRevisionsDataloader: PageRevisionDataloaderService,
    private pageService: PageService,
    private tagDataLoader: PageTagDataloader,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Page, { description: `Returns an page by id or slug.` })
  public async page(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string
  ) {
    if (id != null) {
      const page = await this.pageDataloader.load(id);

      if (!page) {
        throw new NotFoundException(`Page with id ${id} was not found.`);
      }

      return page;
    }

    if (slug != null) {
      const page = await this.pageService.getPageBySlug(slug);

      if (!page) {
        throw new NotFoundException(`Page with slug ${slug} was not found.`);
      }

      return page;
    }

    throw new BadRequestException('Page id or slug required.');
  }

  @Public()
  @Query(() => PaginatedPages, {
    description: `Returns a paginated list of pages based on the filters given.`,
  })
  public pages(@Args() args: PageListArgs, @PreviewMode() isPreview: boolean) {
    if (!isPreview) {
      args.filter = {
        ...args.filter,
        draft: undefined,
        pending: undefined,
        published: true,
      };
    }

    return this.pageService.getPages(args);
  }

  @Permissions(CanCreatePage)
  @Mutation(() => Page, {
    description: `Creates an page.`,
  })
  public createPage(
    @Args() input: CreatePageInput,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.pageService.createPage(input, user?.user?.id);
  }

  @Permissions(CanCreatePage)
  @Mutation(() => Page, {
    description: `Updates an page.`,
  })
  public updatePage(
    @Args() input: UpdatePageInput,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.pageService.updatePage(input, user?.user?.id);
  }

  @Permissions(CanCreatePage)
  @Mutation(() => Page, {
    description: `Duplicates an page.`,
  })
  public duplicatePage(
    @Args('id') id: string,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.pageService.duplicatePage(id, user?.user?.id);
  }

  @Permissions(CanDeletePage)
  @Mutation(() => String, {
    description: `Deletes an page.`,
  })
  public async deletePage(@Args('id') id: string) {
    return (await this.pageService.deletePage(id)).id;
  }

  @Permissions(CanPublishPage)
  @Mutation(() => Page, {
    description: `Publishes an page at the given time.`,
  })
  public publishPage(
    @Args('id') id: string,
    @Args('publishedAt') publishedAt: Date
  ) {
    return this.pageService.publishPage(id, publishedAt);
  }

  @Permissions(CanPublishPage)
  @Mutation(() => Page, {
    description: `Unpublishes all revisions of an page.`,
  })
  public unpublishPage(@Args('id') id: string) {
    return this.pageService.unpublishPage(id);
  }

  @ResolveField(() => PageRevision)
  async latest(@Parent() parent: PPage, @PreviewMode() isPreview: boolean) {
    const { id: pageId } = parent;
    const { draft, pending, published } =
      await this.pageRevisionsDataloader.load(pageId);

    if (!isPreview) {
      return published;
    }

    return draft ?? pending ?? published;
  }

  @Permissions(CanGetPage)
  @ResolveField(() => PageRevision, { nullable: true })
  async draft(@Parent() parent: PPage) {
    const { id: pageId } = parent;
    const { draft } = await this.pageRevisionsDataloader.load(pageId);

    return draft;
  }

  @Permissions(CanGetPage)
  @ResolveField(() => PageRevision, { nullable: true })
  async pending(@Parent() parent: PPage) {
    const { id: pageId } = parent;
    const { pending } = await this.pageRevisionsDataloader.load(pageId);

    return pending;
  }

  @ResolveField(() => PageRevision, { nullable: true })
  async published(@Parent() parent: PPage) {
    const { id: pageId } = parent;
    const { published } = await this.pageRevisionsDataloader.load(pageId);

    return published;
  }

  @ResolveField(() => String, { nullable: true })
  async url(@Parent() parent: PPage) {
    return this.urlAdapter.getPageUrl(parent);
  }

  @ResolveField(() => String, { nullable: true })
  async previewUrl(@Parent() parent: PPage) {
    return this.urlAdapter.getPagePreviewUrl(parent);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: PPage) {
    return this.tagDataLoader.load(parent.id);
  }
}
