import {Global, Module} from '@nestjs/common'
import {STORAGE_CLIENT_MODULE_OPTIONS, STORAGE_CLIENT_SERVICE_TOKEN} from './storage-client.service'

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_CLIENT_MODULE_OPTIONS,
      useFactory: () => ({})
    },
    {
      provide: STORAGE_CLIENT_SERVICE_TOKEN,
      useFactory: () => ({})
    }
  ],
  exports: [STORAGE_CLIENT_MODULE_OPTIONS, STORAGE_CLIENT_SERVICE_TOKEN]
})
export class StorageClientConfigModule {}
