import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailSendResolver } from './mail-send.resolver';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailSendJobExecutor } from './mail-send-job.executor';

@Module({
  imports: [PrismaModule],
  providers: [
    MailSendResolver,
    MailSendJobService,
    MailSendRecipientService,
    MailSendJobExecutor,
  ],
})
export class MailSendModule {}
