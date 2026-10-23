import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { OrganizationMembersDataloader } from './organization-members.dataloader';
import {
  OrganizationMember,
  SensitiveDataOrganization,
} from './organization.model';

@Resolver(() => SensitiveDataOrganization)
export class SensitiveDataOrganizationResolver {
  constructor(private membersDataloader: OrganizationMembersDataloader) {}

  @ResolveField(() => [OrganizationMember])
  public members(@Parent() { id, members }: SensitiveDataOrganization) {
    if (members !== undefined) {
      return members;
    }

    return this.membersDataloader.load(id);
  }
}
