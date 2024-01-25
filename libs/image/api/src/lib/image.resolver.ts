import {Args, Query, Resolver} from '@nestjs/graphql'
import {Image} from './image.model'
import {ImageDataloaderService} from './image-dataloader.service'

@Resolver(() => Image)
export class ImageResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}

  @Query(returns => Image, {description: `Returns an image by id.`})
  public image(@Args('id') id: string) {
    return this.imageDataloader.load(id)
  }
}
