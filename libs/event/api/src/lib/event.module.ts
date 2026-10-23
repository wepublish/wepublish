import { forwardRef, Module } from '@nestjs/common';
import { BlockContentModule } from '@wepublish/block-content/api';
import { ImageModule } from '@wepublish/image/api';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { TagModule } from '@wepublish/tag/api';
import { EventDataloaderService } from './event-dataloader.service';
import {
  EventDatesDataloader,
  EventRatesDataloader,
  EventRevisionImagesDataloader,
} from './event-details.dataloader';
import {
  EventImageResolver,
  EventRevisionResolver,
} from './event-revision.resolver';
import { EventRevisionDataloaderService } from './event-revisions.dataloader';
import { EventScheduleWatcher } from './event-schedule.watcher';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import {
  HasEventLcResolver,
  HasEventResolver,
  HasOptionalEventLcResolver,
  HasOptionalEventResolver,
} from './has-event/has-event.resolver';
import { PlaceDataloaderService } from './place/place-dataloader.service';

@Module({
  imports: [
    GraphqlResponseCacheModule,
    PrismaModule,
    ImageModule,
    TagModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    EventScheduleWatcher,
    EventDataloaderService,
    EventRevisionDataloaderService,
    EventDatesDataloader,
    EventRatesDataloader,
    EventRevisionImagesDataloader,
    PlaceDataloaderService,
    EventService,
    EventResolver,
    EventRevisionResolver,
    EventImageResolver,
    HasEventResolver,
    HasEventLcResolver,
    HasOptionalEventResolver,
    HasOptionalEventLcResolver,
  ],
  exports: [
    EventDataloaderService,
    EventRevisionDataloaderService,
    EventService,
  ],
})
export class EventModule {}
