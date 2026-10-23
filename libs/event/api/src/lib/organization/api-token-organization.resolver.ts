import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ApiToken } from '@wepublish/api-token/api';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { BaseOrganization } from './organization.model';

@Resolver(() => ApiToken)
export class ApiTokenOrganizationResolver {
  constructor(private organizationDataloader: OrganizationDataloaderService) {}

  @ResolveField(() => BaseOrganization, {
    nullable: true,
    description: `The organization this token is bound to. Null for a platform token.`,
  })
  public organization(@Parent() { organizationId }: ApiToken) {
    if (!organizationId) {
      return null;
    }

    return this.organizationDataloader.load(organizationId);
  }
}
