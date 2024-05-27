import {Module} from '@nestjs/common'
import {PermissionsGuard} from './permission.guard'
import {PermissionsResolver} from './permissions.resolver'
import {PermissionDataloader} from './permission.dataloader'

@Module({
  providers: [PermissionsGuard, PermissionsResolver, PermissionDataloader],
  exports: [PermissionsGuard, PermissionDataloader]
})
export class PermissionModule {}
