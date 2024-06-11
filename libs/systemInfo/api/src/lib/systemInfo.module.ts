import {Module} from '@nestjs/common'
import {SystemInfoController} from './systemInfo.controller'

@Module({
  controllers: [SystemInfoController]
})
export class SystemInfoModule {}
