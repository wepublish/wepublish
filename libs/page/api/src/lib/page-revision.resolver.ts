import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PageRevision } from './page.model';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { PageRevisionService } from './page-revision.service';
import { Property } from '@wepublish/utils/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { CanGetPage } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';
import {
  BlockContent,
  isFlexBlock,
  isTeaserSlotsBlock,
  SlotTeasersLoader,
} from '@wepublish/block-content/api';
import { forwardRef, Inject } from '@nestjs/common';

@Resolver(() => PageRevision)
export class PageRevisionResolver {
  constructor(
    private revisionService: PageRevisionService,
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: PageRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.revisionService.getProperties(
      revision.id,
      hasPermission(CanGetPage, user?.roles ?? [])
    );
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() revision: PageRevision) {
    const { imageID } = revision;

    if (!imageID) {
      return null;
    }

    return this.imageDataloaderService.load(imageID);
  }

  @ResolveField(() => Image, { nullable: true })
  public socialMediaImage(@Parent() revision: PageRevision) {
    const { socialMediaImageID } = revision;

    if (!socialMediaImageID) {
      return null;
    }

    return this.imageDataloaderService.load(socialMediaImageID);
  }

  @ResolveField(() => [BlockContent])
  async blocks(
    @Parent() revision: PageRevision
  ): Promise<(typeof BlockContent)[]> {
    if (
      revision.blocks.some(isTeaserSlotsBlock) ||
      revision.blocks.some(isFlexBlock)
    ) {
      return this.slotTeasersLoader.loadSlotTeasersIntoBlocks(revision.blocks);
    }

    return revision.blocks;
  }
}
