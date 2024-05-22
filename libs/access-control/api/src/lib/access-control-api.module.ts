import {Module} from '@nestjs/common'
import {UserRoleResolver} from './user-role.resolver'
import {UserRoleService} from './user-role.service'

@Module({
  providers: [UserRoleResolver, UserRoleService]
})
export class AccessControlApiModule {}
