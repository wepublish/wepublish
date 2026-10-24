import { forwardRef, Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { EventImage as PEventImage } from '@prisma/client';
import { BlockContent, SlotTeasersLoader } from '@wepublish/block-content/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { EventRevisionImagesDataloader } from './event-details.dataloader';
import { EventImage, EventRevision } from './event.model';

@Resolver(() => EventRevision)
export class EventRevisionResolver {
  constructor(
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    private revisionImages: EventRevisionImagesDataloader
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(@Parent() revision: EventRevision) {
    return this.slotTeasersLoader.loadSlotTeasersIntoBlocks(
      (revision.blocks ?? []) as Array<typeof BlockContent>
    );
  }

  @ResolveField(() => [EventImage])
  async images(@Parent() revision: EventRevision) {
    return (await this.revisionImages.load(revision.id)) ?? [];
  }
}

@Resolver(() => EventImage)
export class EventImageResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}

  @ResolveField(() => Image, { nullable: true })
  image(@Parent() { imageId }: PEventImage) {
    return this.imageDataloader.load(imageId);
  }
}
