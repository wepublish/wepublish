import {Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventDataloaderService} from './event-dataloader.service'
import {EventResolver} from './event.resolver'
import {EventService} from './event.service'
import {HasEventResolver} from './has-event/has-event.resolver'

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [EventDataloaderService, EventService, EventResolver, HasEventResolver],
  exports: [EventDataloaderService, EventService]
})
export class EventModule {}
