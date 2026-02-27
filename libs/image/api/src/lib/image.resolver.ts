import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Image } from './image.model';
import {
  ImageDataloaderService,
  ImageWithFocalPoint,
} from './image-dataloader.service';
import { MediaAdapter } from './media-adapter';
import { ImageTransformation } from './image-transformation.model';
import { Public } from '@wepublish/authentication/api';
import { ImageService } from './image.service';

@Resolver(() => Image)
export class ImageResolver {
  constructor(
    private imageDataloader: ImageDataloaderService,
    private mediaAdapter: MediaAdapter,
    private imageService: ImageService
  ) {}

  @Public()
  @Query(() => Image, { description: `Returns an image by id.` })
  public getImage(@Args('id') id: string) {
    return this.imageDataloader.load(id);
  }

  @Public()
  @Query(() => [Image], { description: `Returns images by tag.` })
  public getImagesByTag(@Args('tag') tag: string) {
    return this.imageService.getImagesByTag(tag);
  }

  @ResolveField(() => String)
  public async url(@Parent() image: ImageWithFocalPoint) {
    return this.mediaAdapter.getImageURL(image);
  }

  @ResolveField(() => String, { nullable: true })
  public async transformURL(
    @Args('input', { nullable: true }) transformation: ImageTransformation,
    @Parent() image: ImageWithFocalPoint
  ) {
    return this.mediaAdapter.getImageURL(image, transformation);
  }
}
