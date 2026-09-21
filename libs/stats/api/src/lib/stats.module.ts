import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { DashboardModule } from '@wepublish/membership/api';
import { StatsResolver } from './stats.resolver';
import { StatsService } from './stats.service';
import { MediumStatsService } from './medium-stats.service';

@Module({
  imports: [PrismaModule, DashboardModule],
  providers: [StatsService, StatsResolver, MediumStatsService],
  exports: [MediumStatsService],
})
export class StatsModule {}
