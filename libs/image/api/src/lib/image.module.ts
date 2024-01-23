import {Module} from '@nestjs/common'
import {ImageResolver} from './image.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {ImageDataloaderService} from './image-dataloader.service'

@Module({
  imports: [PrismaModule],
  providers: [ImageResolver, ImageDataloaderService],
  exports: [ImageDataloaderService]
})
export class ImageModule {}
