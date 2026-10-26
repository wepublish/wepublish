import { Module } from '@nestjs/common';
import { SessionCacheModule } from '@wepublish/authentication/api';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserModule } from '@wepublish/user/api';
import { EventTaxonomyModule } from '../taxonomy/event-taxonomy.module';
import { ApiTokenOrganizationResolver } from './api-token-organization.resolver';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { OrganizationMemberResolver } from './organization-member.resolver';
import { OrganizationMembersDataloader } from './organization-members.dataloader';
import { OrganizationRegionResolver } from './organization-region.resolver';
import {
  OrganizationAffiliationsDataloader,
  OrganizationContactsDataloader,
  OrganizationTagsDataloader,
} from './organization-relations.dataloader';
import { OrganizationRelationsResolver } from './organization-relations.resolver';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { SensitiveDataOrganizationResolver } from './sensitive-data-organization.resolver';

@Module({
  imports: [
    PrismaModule,
    SessionCacheModule,
    GraphqlResponseCacheModule,
    UserModule,
    EventTaxonomyModule,
  ],
  providers: [
    OrganizationService,
    OrganizationResolver,
    SensitiveDataOrganizationResolver,
    OrganizationMemberResolver,
    ApiTokenOrganizationResolver,
    OrganizationRegionResolver,
    OrganizationRelationsResolver,
    OrganizationDataloaderService,
    OrganizationMembersDataloader,
    OrganizationTagsDataloader,
    OrganizationAffiliationsDataloader,
    OrganizationContactsDataloader,
  ],
  exports: [OrganizationService, OrganizationDataloaderService],
})
export class OrganizationModule {}
