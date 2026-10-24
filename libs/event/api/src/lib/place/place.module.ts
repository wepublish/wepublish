import { Module } from '@nestjs/common';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { OrganizationModule } from '../organization/organization.module';
import { EventTaxonomyModule } from '../taxonomy/event-taxonomy.module';
import { PlaceDataloaderService } from './place-dataloader.service';
import { PlaceResolver } from './place.resolver';
import { PlaceService } from './place.service';

@Module({
  imports: [
    PrismaModule,
    GraphqlResponseCacheModule,
    OrganizationModule,
    EventTaxonomyModule,
  ],
  providers: [PlaceService, PlaceResolver, PlaceDataloaderService],
  exports: [PlaceService, PlaceDataloaderService],
})
export class PlaceModule {}
