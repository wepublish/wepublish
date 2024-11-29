import {Module} from '@nestjs/common'
import {ImageResolver} from './image.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {ImageDataloaderService} from './image-dataloader.service'
import {HasImageResolver} from './has-image/has-image.resolver'

@Module({
  imports: [PrismaModule],
  providers: [ImageResolver, ImageDataloaderService, HasImageResolver],
  exports: [ImageDataloaderService]
})
export class ImageModule {}
