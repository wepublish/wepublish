import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ChangelogResolver } from './changelog.resolver';
import { ChangelogService } from './changelog.service';

@Module({
  imports: [PrismaModule],
  providers: [ChangelogResolver, ChangelogService],
  exports: [ChangelogService],
})
export class ChangelogModule {}
