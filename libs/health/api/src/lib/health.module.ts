import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@wepublish/nest-modules';
import { TerminusModule } from '@nestjs/terminus';
import { DragonflyHealthIndicator } from './dragonfly.health';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [DragonflyHealthIndicator],
})
export class HealthModule {}
