import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasImage, HasImageLc } from './has-image.model';
import { Image } from '../image.model';
import { ImageDataloaderService } from '../image-dataloader.service';

@Resolver(() => HasImage)
export class HasImageResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() block: HasImage) {
    const { imageID } = block;

    if (!imageID) {
      return null;
    }

    return this.imageDataloader.load(imageID);
  }
}

@Resolver(() => HasImageLc)
export class HasImageLcResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() block: HasImageLc) {
    const { imageId } = block;

    if (!imageId) {
      return null;
    }

    return this.imageDataloader.load(imageId);
  }
}
