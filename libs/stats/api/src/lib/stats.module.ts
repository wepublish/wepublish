import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { StatsResolver } from './stats.resolver';
import { StatsService } from './stats.service';

@Module({
  imports: [PrismaModule],
  providers: [StatsService, StatsResolver],
})
export class StatsModule {}
