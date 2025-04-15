import {Module} from '@nestjs/common'
import {PermissionsGuard} from './permission.guard'

@Module({
  providers: [PermissionsGuard],
  exports: [PermissionsGuard]
})
export class PermissionModule {}
