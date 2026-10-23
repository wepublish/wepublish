import { Module } from '@nestjs/common';
import { SessionCacheModule } from '@wepublish/authentication/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserModule } from '@wepublish/user/api';
import { ApiTokenOrganizationResolver } from './api-token-organization.resolver';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { OrganizationMemberResolver } from './organization-member.resolver';
import { OrganizationMembersDataloader } from './organization-members.dataloader';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { SensitiveDataOrganizationResolver } from './sensitive-data-organization.resolver';

@Module({
  imports: [PrismaModule, SessionCacheModule, UserModule],
  providers: [
    OrganizationService,
    OrganizationResolver,
    SensitiveDataOrganizationResolver,
    OrganizationMemberResolver,
    ApiTokenOrganizationResolver,
    OrganizationDataloaderService,
    OrganizationMembersDataloader,
  ],
  exports: [OrganizationService, OrganizationDataloaderService],
})
export class OrganizationModule {}
