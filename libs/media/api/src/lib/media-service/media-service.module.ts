import { Module } from '@nestjs/common';
import { MediaLinkCacheModule } from '../link-cache/media-link-cache.module';
import { MediaService } from './media.service';

@Module({
  imports: [MediaLinkCacheModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaServiceModule {}
