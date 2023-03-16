import {Module} from '@nestjs/common'
import {APP_GUARD} from '@nestjs/core'
import {PermissionsGuard} from './permission.guard'

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class PermissionModule {}
