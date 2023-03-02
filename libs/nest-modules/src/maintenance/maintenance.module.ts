import {Module} from '@nestjs/common'
import {VersionInformationResolver} from './versionInformation.resolver'

@Module({
  providers: [VersionInformationResolver]
})
export class MaintenanceModule {}
