import {Module} from '@nestjs/common'
import {MaintenanceModule} from '../maintenance/maintenance.module'
import {MembershipApiModule} from '../../../membership/api/src/'
@Module({
  imports: [MaintenanceModule, MembershipApiModule]
})
export class ApiModule {}
