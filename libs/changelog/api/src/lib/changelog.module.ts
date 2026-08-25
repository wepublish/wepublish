import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ChangelogResolver } from './changelog.resolver';
import { ChangelogService } from './changelog.service';
import { NotificationReadResolver } from './notification-read.resolver';
import { NotificationReadService } from './notification-read.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ChangelogResolver,
    ChangelogService,
    NotificationReadResolver,
    NotificationReadService,
  ],
  exports: [ChangelogService, NotificationReadService],
})
export class ChangelogModule {}
