import {Module} from '@nestjs/common'
import {PermissionsGuard} from './permission.guard'
import {PublicGuard} from './public.guard'

@Module({
  providers: [PermissionsGuard, PublicGuard],
  exports: [PermissionsGuard, PublicGuard]
})
export class PermissionModule {}
