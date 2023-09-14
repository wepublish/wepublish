import {Module} from '@nestjs/common'
import {PrismaModule} from './database/prisma.module'
import {MaintenanceModule} from './maintenance/maintenance.module'

@Module({
  imports: [MaintenanceModule, PrismaModule]
})
export class ApiModule {}
