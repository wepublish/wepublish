import {Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventDataloaderService} from './event-dataloader.service'
import {EventService} from './event.service'
import {
  HasEventLcResolver,
  HasEventResolver,
  HasOptionalEventLcResolver,
  HasOptionalEventResolver
} from './has-event/has-event.resolver'
import {EventResolver} from './event.resolver'

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [
    EventDataloaderService,
    EventService,
    EventResolver,
    HasEventResolver,
    HasEventLcResolver,
    HasOptionalEventResolver,
    HasOptionalEventLcResolver
  ],
  exports: [EventDataloaderService, EventService]
})
export class EventModule {}
