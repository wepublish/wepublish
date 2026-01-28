import { forwardRef, Module } from '@nestjs/common';
import { ImageResolver } from './image.resolver';
import { PrismaModule } from '@wepublish/nest-modules';
import { ImageDataloaderService } from './image-dataloader.service';
import {
  HasImageLcResolver,
  HasImageResolver,
} from './has-image/has-image.resolver';
import { ImageService } from './image.service';
import { ImageUploadService } from './image-upload.service';
import { PeerModule } from '@wepublish/peering/api';

@Module({
  imports: [PrismaModule, forwardRef(() => PeerModule)],
  providers: [
    ImageResolver,
    ImageDataloaderService,
    HasImageResolver,
    HasImageLcResolver,
    ImageService,
    ImageUploadService,
  ],
  exports: [ImageDataloaderService, ImageUploadService],
})
export class ImageModule {}
