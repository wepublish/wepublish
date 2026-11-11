import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailSendModule } from '../mail-send/mail-send.module';
import { DeliveryModeResolver } from './delivery-mode.resolver';
import { DeliverySuggestionService } from './delivery-suggestion.service';
import { UserDeliveryPreferenceService } from './user-delivery-preference.service';

/**
 * Per-user delivery mode of automated subscription mails. The letter sender
 * it needs comes from the global letters module.
 */
@Module({
  imports: [PrismaModule, MailSendModule],
  providers: [
    DeliveryModeResolver,
    UserDeliveryPreferenceService,
    DeliverySuggestionService,
  ],
  exports: [DeliverySuggestionService],
})
export class DeliveryModeModule {}
