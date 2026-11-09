import { Module } from '@nestjs/common';
import { AudioResolver } from './audio.resolver';
import { PrismaModule } from '@wepublish/nest-modules';
import { AudioService } from './audio.service';
import { AudioUploadService } from './audio-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [AudioResolver, AudioService, AudioUploadService],
  exports: [AudioUploadService],
})
export class AudioModule {}
