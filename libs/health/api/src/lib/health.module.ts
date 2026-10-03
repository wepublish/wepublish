import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { TerminusModule } from '@nestjs/terminus';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { DragonflyHealthIndicator } from './dragonfly.health';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, KvTtlCacheModule],
  controllers: [HealthController],
  providers: [DragonflyHealthIndicator],
})
export class HealthModule {}
