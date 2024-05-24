import {Resolver, Query} from '@nestjs/graphql'
import {PermissionObject} from './permission.model'
import {Permissions} from './permission.decorator'
import {AllPermissions, CanGetPermissions} from './permissions'

@Resolver(() => PermissionObject)
export class PermissionsResolver {
  @Query(() => [PermissionObject], {description: 'Returns permissions list'})
  @Permissions(CanGetPermissions)
  getPermissions() {
    return AllPermissions
  }
}
