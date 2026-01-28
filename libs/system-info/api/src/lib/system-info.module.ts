import { Module } from '@nestjs/common';
import { SystemInfoController } from './system-info.controller';

@Module({
  controllers: [SystemInfoController],
})
export class SystemInfoModule {}
