import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Image} from './image.model'
import {ImageDataloaderService} from './image-dataloader.service'
import {Public} from '@wepublish/authentication/api'
import {MediaAdapter} from './media-adapter'
import {ImageService} from './image.service'
import {ImageTransformation} from './image-transformation.model'

@Resolver(() => Image)
export class ImageResolver {
  constructor(
    private imageDataloader: ImageDataloaderService,
    private mediaAdapter: MediaAdapter,
    private imageService: ImageService
  ) {}

  @Public()
  @Query(returns => Image, {description: `Returns an image by id.`})
  public getImage(@Args('id') id: string) {
    return this.imageDataloader.load(id)
  }

  @ResolveField(() => String)
  public async url(@Parent() image: Image) {
    const imageWithFocalPoint = await this.imageService.ensureImageHasFocalPoint(image)
    return this.mediaAdapter.getImageURL(imageWithFocalPoint)
  }

  @ResolveField(() => String, {nullable: true})
  public async transformURL(
    @Args('input', {nullable: true}) transformation: ImageTransformation,
    @Parent() image: Image
  ) {
    const imageWithFocalPoint = await this.imageService.ensureImageHasFocalPoint(image)
    return this.mediaAdapter.getImageURL(imageWithFocalPoint, transformation)
  }
}
