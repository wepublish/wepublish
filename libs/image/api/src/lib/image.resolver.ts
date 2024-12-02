import {Args, Query, Resolver} from '@nestjs/graphql'
import {ImageV2} from './image.model'
import {ImageDataloaderService} from './image-dataloader.service'
import {Public} from '@wepublish/permissions/api'

@Resolver(() => ImageV2)
export class ImageResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}

  @Public()
  @Query(returns => ImageV2, {description: `Returns an image by id.`})
  public getImage(@Args('id') id: string) {
    return this.imageDataloader.load(id)
  }
}
