import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  AllPermissions,
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetUserRole,
  CanGetUserRoles,
  EditorPermissions,
  PeerPermissions,
} from '@wepublish/permissions';
import {
  CreateUserRoleInput,
  UserRole,
  UserRoleListArgs,
  PaginatedUserRoles,
  UpdateUserRoleInput,
} from './user-role.model';
import { UserRoleService } from './user-role.service';
import { UserRoleDataloader } from './user-role.dataloader';
import { Permission, Permissions } from '@wepublish/permissions/api';
import { NotFoundException } from '@nestjs/common';
import { UserRole as PUserRole } from '@prisma/client';

@Resolver(() => UserRole)
export class UserRoleResolver {
  constructor(
    private service: UserRoleService,
    private dataloader: UserRoleDataloader
  ) {}

  @Permissions(CanGetUserRoles, CanGetUserRole)
  @Query(() => PaginatedUserRoles, {
    description: `Returns a paginated list of userroles based on the filters given.`,
  })
  public userRoles(@Args() filter: UserRoleListArgs) {
    return this.service.getUserRoles(filter);
  }

  @Permissions(CanGetUserRoles, CanGetUserRole)
  @Query(() => UserRole, { description: `Returns a userrole by id.` })
  public async userRole(@Args('id') id: string) {
    const userrole = await this.dataloader.load(id);

    if (!userrole) {
      throw new NotFoundException(`UserRole with id ${id} was not found.`);
    }

    return userrole;
  }

  @Permissions(CanCreateUserRole)
  @Mutation(returns => UserRole, { description: `Creates a new userrole.` })
  public createUserRole(@Args() userrole: CreateUserRoleInput) {
    return this.service.createUserRole(userrole);
  }

  @Permissions(CanCreateUserRole)
  @Mutation(returns => UserRole, {
    description: `Updates an existing userrole.`,
  })
  public updateUserRole(@Args() userrole: UpdateUserRoleInput) {
    return this.service.updateUserRole(userrole);
  }

  @Permissions(CanDeleteUserRole)
  @Mutation(returns => UserRole, {
    description: `Deletes an existing userrole.`,
  })
  public deleteUserRole(@Args('id') id: string) {
    return this.service.deleteUserRole(id);
  }

  @ResolveField(() => [Permission])
  async permissions(@Parent() { id, permissionIDs }: PUserRole) {
    switch (id) {
      case 'admin':
        return AllPermissions;
      case 'editor':
        return EditorPermissions;
      case 'peer':
        return PeerPermissions;
      default:
        return AllPermissions.filter(permission =>
          permissionIDs.includes(permission.id)
        );
    }
  }
}
