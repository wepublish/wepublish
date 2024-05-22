import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {UserRoleService} from './user-role.service'
import {
  GetUserRolesArgs,
  CreateUserRoleArgs,
  UpdateUserRoleArgs,
  UserRole,
  UserRoleIdArgs,
  GetUserRolesResult
} from './user-role.model'
import {
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetUserRole,
  CanGetUserRoles
} from '@wepublish/permissions/api'
import {Permissions} from '@wepublish/permissions/api'

@Resolver(() => UserRole)
export class UserRoleResolver {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Query(() => UserRole, {description: 'Returns a user role'})
  @Permissions(CanGetUserRole)
  getUserRoleById(@Args() args: UserRoleIdArgs) {
    return this.userRoleService.getUserRoleById(args.id)
  }

  @Query(() => GetUserRolesResult, {description: 'Returns a list of user roles'})
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
}
