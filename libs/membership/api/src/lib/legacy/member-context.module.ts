import { Module } from '@nestjs/common';
import { MemberContextService } from './member-context.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { NewsletterModule } from '../newsletter/newsletter.module';

@Module({
  imports: [PrismaModule, PaymentsModule, NewsletterModule],
  providers: [MemberContextService],
  exports: [MemberContextService],
})
export class MemberContextModule {}
