import {Global, Module} from '@nestjs/common'
import {MEDIA_SERVICE_MODULE_OPTIONS, MEDIA_SERVICE_TOKEN} from './media.service'

@Global()
@Module({
  providers: [
    {
      provide: MEDIA_SERVICE_MODULE_OPTIONS,
      useFactory: () => ({})
    },
    {
      provide: MEDIA_SERVICE_TOKEN,
      useFactory: () => ({})
    }
  ],
  exports: [MEDIA_SERVICE_MODULE_OPTIONS, MEDIA_SERVICE_TOKEN]
})
export class MediaServiceConfigModule {}
