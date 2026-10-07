import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { TerminusModule } from '@nestjs/terminus';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { DragonflyHealthIndicator } from './dragonfly.health';
import { HealthController } from './health.controller';
import { HttpPingHealthIndicator } from './http-ping.health';

@Module({
  imports: [PrismaModule, TerminusModule, KvTtlCacheModule],
  controllers: [HealthController],
  providers: [DragonflyHealthIndicator, HttpPingHealthIndicator],
})
export class HealthModule {}
