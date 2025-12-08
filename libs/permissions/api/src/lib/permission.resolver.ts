import { Query, Resolver } from '@nestjs/graphql';
import { Permission } from './permission.model';
import { AllPermissions, CanGetPermissions } from '@wepublish/permissions';
import { Permissions } from './permission.decorator';

@Resolver(() => Permission)
export class PermissionResolver {
  @Permissions(CanGetPermissions)
  @Query(() => [Permission], {
    description: 'Returns a list of all permissions.',
  })
  async permissions() {
    return AllPermissions;
  }
}
