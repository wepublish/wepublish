import {Module} from '@nestjs/common'
import {PermissionsGuard} from './permission.guard'
import {PublicGuard} from './public.guard'
import {AuthenticatedGuard} from './authenticated.guard'

@Module({
  providers: [PermissionsGuard, PublicGuard, AuthenticatedGuard],
  exports: [PermissionsGuard, PublicGuard, AuthenticatedGuard]
})
export class PermissionModule {}
