import {Module} from '@nestjs/common'
import {ImageResolver} from './image.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {ImageDataloaderService} from './image-dataloader.service'
import {HasImageLcResolver, HasImageResolver} from './has-image/has-image.resolver'
import {ImageService} from './image.service'

@Module({
  imports: [PrismaModule],
  providers: [
    ImageResolver,
    ImageDataloaderService,
    HasImageResolver,
    HasImageLcResolver,
    ImageService
  ],
  exports: [ImageDataloaderService, ImageService]
})
export class ImageModule {}
