import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PageRevision } from './page.model';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { PagePropertyDataloader, Property } from '@wepublish/property/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { hasPermission } from '@wepublish/permissions/api';
import { BlockContent, SlotTeasersLoader } from '@wepublish/block-content/api';
import { forwardRef, Inject } from '@nestjs/common';
import { CanGetPage } from '@wepublish/permissions';

@Resolver(() => PageRevision)
export class PageRevisionResolver {
  constructor(
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    private imageDataloaderService: ImageDataloaderService,
    private propertyDataLoader: PagePropertyDataloader
  ) {}

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: PageRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = await this.propertyDataLoader.load(revision.id);

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetPage, user?.roles ?? [])
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
  async blocks(@Parent() parent: PageRevision) {
    return await this.slotTeasersLoader.loadSlotTeasersIntoBlocks(
      parent.blocks
    );
  }

  @ResolveField(() => String, { nullable: true })
  async _debug(@Parent() parent: PageRevision) {
    return this.slotTeasersLoader.getDebugInfo(parent.blocks);
  }
}
