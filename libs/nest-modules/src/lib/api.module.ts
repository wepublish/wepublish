import {Module} from '@nestjs/common'
import {MaintenanceModule} from '../maintenance/maintenance.module'

@Module({
  imports: [MaintenanceModule]
})
export class ApiModule {}
