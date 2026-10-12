import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';

import { ActionMailResolver } from './action-mail.resolver';
import { ActionMailService } from './action-mail.service';

@Module({
  imports: [PrismaModule],
  providers: [ActionMailService, ActionMailResolver],
})
export class ActionMailModule {}
