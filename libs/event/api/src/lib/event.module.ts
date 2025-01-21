import {Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventDataloaderService} from './event-dataloader.service'
import {EventService} from './event.service'

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [
    EventDataloaderService,
    EventService
    // EventResolver
  ],
  exports: [EventDataloaderService, EventService]
})
export class EventModule {}
