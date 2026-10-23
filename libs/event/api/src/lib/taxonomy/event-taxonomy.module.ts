import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  AudienceDataloader,
  RegionDataloader,
} from './event-taxonomy.dataloader';
import { EventTaxonomyResolver } from './event-taxonomy.resolver';
import { EventTaxonomyService } from './event-taxonomy.service';

@Module({
  imports: [PrismaModule],
  providers: [
    EventTaxonomyService,
    EventTaxonomyResolver,
    RegionDataloader,
    AudienceDataloader,
  ],
  exports: [EventTaxonomyService, RegionDataloader, AudienceDataloader],
})
export class EventTaxonomyModule {}
