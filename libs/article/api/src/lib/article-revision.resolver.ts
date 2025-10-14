import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ArticleRevision } from './article.model';
import { ArticleAuthorsService, Author } from '@wepublish/author/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { ArticleRevisionService } from './article-revision.service';
import { Property } from '@wepublish/utils/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { CanGetArticle } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';
import {
  SlotTeasersLoader,
  BlockContent,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/api';
import { forwardRef, Inject } from '@nestjs/common';

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    private revisionService: ArticleRevisionService,
    private articleAuthors: ArticleAuthorsService,
    private imageDataloaderService: ImageDataloaderService,
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(
    @Parent() revision: ArticleRevision
  ): Promise<(typeof BlockContent)[]> {
    if (revision.blocks.some(isTeaserSlotsBlock)) {
      return this.slotTeasersLoader.loadSlotTeasersIntoBlocks(revision.blocks);
    }

    return revision.blocks;
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: ArticleRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.revisionService.getProperties(
      revision.id,
      hasPermission(CanGetArticle, user?.roles ?? [])
    );
  }

  @ResolveField(() => [Author])
  public async socialMediaAuthors(@Parent() revision: ArticleRevision) {
    return this.articleAuthors.getSocialMediaAuthors(revision.id);
  }

  @ResolveField(() => [Author])
  public async authors(@Parent() revision: ArticleRevision) {
    return this.articleAuthors.getAuthors(revision.id);
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() revision: ArticleRevision) {
    const { imageID } = revision;

    if (!imageID) {
      return null;
    }

    return this.imageDataloaderService.load(imageID);
  }

  @ResolveField(() => Image, { nullable: true })
  public socialMediaImage(@Parent() revision: ArticleRevision) {
    const { socialMediaImageID } = revision;

    if (!socialMediaImageID) {
      return null;
    }

    return this.imageDataloaderService.load(socialMediaImageID);
  }
}
