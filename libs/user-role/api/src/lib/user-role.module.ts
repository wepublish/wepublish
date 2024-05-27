import {Module} from '@nestjs/common'
import {UserRoleResolver} from './user-role.resolver'
import {UserRoleService} from './user-role.service'
import {PermissionModule} from '@wepublish/permissions/api'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  imports: [PrismaModule, PermissionModule],
  providers: [UserRoleResolver, UserRoleService]
})
export class UserRoleModule {}
