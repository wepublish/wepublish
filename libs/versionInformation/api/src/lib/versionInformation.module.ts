import { Module } from '@nestjs/common';
import { VersionInformationResolver } from './versionInformation.resolver';
import { PrismaModule } from '@wepublish/nest-modules';

@Module({
  imports: [PrismaModule],
  providers: [VersionInformationResolver],
})
export class VersionInformationModule {}
