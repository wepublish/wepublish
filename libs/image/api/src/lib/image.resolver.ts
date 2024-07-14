import {Resolver} from '@nestjs/graphql'
import {Image} from './image.model'
import {ImageDataloaderService} from './image-dataloader.service'

@Resolver(() => Image)
export class ImageResolver {
  constructor(private imageDataloader: ImageDataloaderService) {}
}
