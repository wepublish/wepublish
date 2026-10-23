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
import { EventResolver, OccurrenceResolver } from './event.resolver';
import { EventService } from './event.service';
import {
  HasEventLcResolver,
  HasEventResolver,
  HasOptionalEventLcResolver,
  HasOptionalEventResolver,
} from './has-event/has-event.resolver';
import { EventRelationsResolver } from './event-relations.resolver';
import { OrganizationModule } from './organization/organization.module';
import { PlaceModule } from './place/place.module';
import { EventTaxonomyModule } from './taxonomy/event-taxonomy.module';

@Module({
  imports: [
    GraphqlResponseCacheModule,
    PrismaModule,
    ImageModule,
    TagModule,
    OrganizationModule,
    PlaceModule,
    EventTaxonomyModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    EventScheduleWatcher,
    EventDataloaderService,
    EventRevisionDataloaderService,
    EventDatesDataloader,
    EventRatesDataloader,
    EventRevisionImagesDataloader,
    EventService,
    EventResolver,
    OccurrenceResolver,
    EventRelationsResolver,
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
