import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {UserRoleService} from './user-role.service'
import {
  CreateUserRoleArgs,
  GetUserRolesArgs,
  PaginatedUserRoles,
  UpdateUserRoleArgs,
  UserRole,
  UserRoleIdArgs
} from './user-role.model'
import {
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetUserRole,
  CanGetUserRoles,
  PermissionDataloader,
  PermissionObject,
  Permissions
} from '@wepublish/permissions/api'

@Resolver(() => UserRole)
export class UserRoleResolver {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly permissionDataloader: PermissionDataloader
  ) {}

  @Query(() => UserRole, {description: 'Returns a user role'})
  @Permissions(CanGetUserRole)
  getUserRoleById(@Args() args: UserRoleIdArgs) {
    return this.userRoleService.getUserRoleById(args.id)
  }

  @Query(() => PaginatedUserRoles, {description: 'Returns a list of user roles'})
  @Permissions(CanGetUserRoles)
  getUserRoles(@Args() args: GetUserRolesArgs) {
    return this.userRoleService.getUserRoles(args)
  }

  @Mutation(() => UserRole, {description: 'Create a user role'})
  @Permissions(CanCreateUserRole)
  createUserRole(@Args() {userRole}: CreateUserRoleArgs) {
    return this.userRoleService.createUserRole(userRole)
  }

  @Mutation(() => UserRole, {description: 'Updates a user role'})
  @Permissions(CanCreateUserRole)
  updateUserRole(@Args() {userRole}: UpdateUserRoleArgs) {
    return this.userRoleService.updateUserRole(userRole)
  }

  @Mutation(() => UserRole, {description: 'Deletes a user role'})
  @Permissions(CanDeleteUserRole)
  deleteUserRole(@Args() {id}: UserRoleIdArgs) {
    return this.userRoleService.deleteUserRoleById(id)
  }

  @ResolveField(returns => [PermissionObject])
  public permissions(@Parent() userRole: UserRole) {
    const {permissionIDs} = userRole
    if (!permissionIDs) {
      return []
    }
    return this.permissionDataloader.loadMany(permissionIDs)
  }
}
