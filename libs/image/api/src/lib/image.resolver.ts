import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Image,
  ImageListArgs,
  PaginatedImages,
  UpdateImageInput,
  UploadImageInput,
} from './image.model';
import {
  ImageDataloaderService,
  ImageWithFocalPoint,
} from './image-dataloader.service';
import { MediaAdapter } from './media-adapter';
import { ImageTransformation } from './image-transformation.model';
import { NotFoundException } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import { ImageService } from './image.service';

@Resolver(() => Image)
export class ImageResolver {
  constructor(
    private service: ImageService,
    private imageDataloader: ImageDataloaderService,
    private mediaAdapter: MediaAdapter,
    private imageService: ImageService
  ) {}

  @Permissions(CanGetImages)
  @Query(() => PaginatedImages, {
    description: `Returns a paginated list of images based on the filters given.`,
  })
  public images(@Args() filter: ImageListArgs) {
    return this.service.getImages(filter);
  }

  @Permissions(CanGetImage)
  @Query(() => Image, { description: `Returns a image by id.` })
  public async image(@Args('id') id: string) {
    const image = await this.imageDataloader.load(id);

    if (!image) {
      throw new NotFoundException(`Image with id ${id} was not found.`);
    }

    return image;
  }

  @Permissions(CanCreateImage)
  @Mutation(returns => Image, { description: `Uploads a new image.` })
  public uploadImage(@Args() image: UploadImageInput) {
    return this.service.createImage(image);
  }

  @Permissions(CanCreateImage)
  @Mutation(returns => Image, { description: `Updates an existing image.` })
  public updateImage(@Args() image: UpdateImageInput) {
    return this.service.updateImage(image);
  }

  @Permissions(CanDeleteImage)
  @Mutation(returns => String, { description: `Deletes an existing image.` })
  public deleteImage(@Args('id') id: string) {
    return this.service.deleteImage(id);
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
