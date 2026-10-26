import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import {
  CanCreateOrganization,
  CanDeleteOrganization,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  BaseOrganization,
  CreateOrganizationInput,
  OrganizationArgs,
  OrganizationListArgs,
  OrganizationMember,
  OrganizationMemberArgs,
  PaginatedOrganizations,
  SensitiveDataOrganization,
  UpdateOrganizationInput,
} from './organization.model';
import { OrganizationService } from './organization.service';

@Resolver(() => BaseOrganization)
export class OrganizationResolver {
  constructor(private organizationService: OrganizationService) {}

  @Public()
  @Query(() => BaseOrganization, {
    nullable: true,
    description: `Returns an organization by id or slug. Members and whoever may read any organization get a SensitiveDataOrganization.`,
  })
  public organization(
    @Args() args: OrganizationArgs,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.organizationService.getOrganization(args, session);
  }

  @Public()
  @Query(() => PaginatedOrganizations, {
    description: `Returns a paginated list of organizations based on the filters given.`,
  })
  public organizations(
    @Args() args: OrganizationListArgs,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.organizationService.getOrganizations(args, session);
  }

  @Permissions(CanCreateOrganization)
  @Mutation(() => SensitiveDataOrganization, {
    description: `Creates an organization. A creator without CAN_UPDATE_OTHER_ORGANIZATIONS becomes its member.`,
  })
  public createOrganization(
    @Args() input: CreateOrganizationInput,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.organizationService.createOrganization(input, session);
  }

  @Permissions(CanUpdateOrganization)
  @Mutation(() => SensitiveDataOrganization, {
    description: `Updates an organization you are a member of, or any with CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public updateOrganization(
    @Args() input: UpdateOrganizationInput,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.organizationService.updateOrganization(input, session);
  }

  @Permissions(CanDeleteOrganization)
  @Mutation(() => SensitiveDataOrganization, {
    description: `Deletes an organization you are a member of, or any with CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public deleteOrganization(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return this.organizationService.deleteOrganization(id, session);
  }

  @Permissions(CanUpdateOtherOrganizations)
  @Mutation(() => OrganizationMember, {
    description: `Makes a user a member of an organization.`,
  })
  public addOrganizationMember(@Args() args: OrganizationMemberArgs) {
    return this.organizationService.addOrganizationMember(args);
  }

  @Permissions(CanUpdateOtherOrganizations)
  @Mutation(() => OrganizationMember, {
    description: `Removes a user from an organization.`,
  })
  public removeOrganizationMember(@Args() args: OrganizationMemberArgs) {
    return this.organizationService.removeOrganizationMember(args);
  }
}
