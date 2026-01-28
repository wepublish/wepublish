import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImageFetcherService } from './image-fetcher.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [ImageFetcherService],
  exports: [ImageFetcherService],
})
export class ImageFetcherModule {}
