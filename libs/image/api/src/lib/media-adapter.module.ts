import {Module} from '@nestjs/common'
import {MediaAdapterService} from './media-adapter.service'

@Module({
  providers: [
    {
      provide: MediaAdapterService,
      useClass: MediaAdapterService
    }
  ],
  exports: [MediaAdapterService]
})
export class MediaAdapterModule {}
