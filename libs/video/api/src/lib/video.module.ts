import { Module } from '@nestjs/common';
import { VideoResolver } from './video.resolver';
import { PrismaModule } from '@wepublish/nest-modules';
import { VideoService } from './video.service';
import { VideoUploadService } from './video-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [VideoResolver, VideoService, VideoUploadService],
  exports: [VideoUploadService],
})
export class VideoModule {}
