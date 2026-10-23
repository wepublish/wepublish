import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { User, UserDataloaderService } from '@wepublish/user/api';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { BaseOrganization, OrganizationMember } from './organization.model';

@Resolver(() => OrganizationMember)
export class OrganizationMemberResolver {
  constructor(
    private userDataloader: UserDataloaderService,
    private organizationDataloader: OrganizationDataloaderService
  ) {}

  @ResolveField(() => User, { nullable: true })
  public user(@Parent() member: OrganizationMember) {
    return this.userDataloader.load(member.userId);
  }

  @ResolveField(() => BaseOrganization, { nullable: true })
  public organization(@Parent() member: OrganizationMember) {
    return this.organizationDataloader.load(member.organizationId);
  }
}
