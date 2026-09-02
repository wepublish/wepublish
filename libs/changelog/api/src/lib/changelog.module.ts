import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ChangelogResolver } from './changelog.resolver';
import { ChangelogService } from './changelog.service';
import { NotificationConfirmationResolver } from './notification-confirmation.resolver';
import { NotificationConfirmationService } from './notification-confirmation.service';
import { NotificationReadResolver } from './notification-read.resolver';
import { NotificationReadService } from './notification-read.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ChangelogResolver,
    ChangelogService,
    NotificationConfirmationResolver,
    NotificationConfirmationService,
    NotificationReadResolver,
    NotificationReadService,
  ],
  exports: [
    ChangelogService,
    NotificationConfirmationService,
    NotificationReadService,
  ],
})
export class ChangelogModule {}
