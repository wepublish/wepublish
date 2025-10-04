import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Image } from './image.model';
import {
  ImageDataloaderService,
  ImageWithFocalPoint,
} from './image-dataloader.service';
import { Public } from '@wepublish/authentication/api';
import { MediaAdapter } from './media-adapter';
import { ImageTransformation } from './image-transformation.model';

@Resolver(() => Image)
export class ImageResolver {
  constructor(
    private imageDataloader: ImageDataloaderService,
    private mediaAdapter: MediaAdapter
  ) {}

  @Public()
  @Query(() => Image, { description: `Returns an image by id.` })
  public getImage(@Args('id') id: string) {
    return this.imageDataloader.load(id);
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
