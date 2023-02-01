import {Module} from '@nestjs/common'
import {MailProviderService, MailTemplateSyncService, PrismaService} from '@wepublish/api'
import {SubscriptionFlowSettings} from './providers/subscription-flow-settings'
import {MailTemplatesResolver} from './resolvers/mail-template.resolver'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowSettings,
    PrismaService,
    MailProviderService,
    MailTemplatesResolver,
    MailTemplateSyncService
  ],
  exports: [],
  imports: []
})
export class MembershipApiModule {}
