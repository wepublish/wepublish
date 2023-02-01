import {Module} from '@nestjs/common'
import {MailProviderService, MailTemplateSyncService, PrismaService} from '@wepublish/api'
import {SubscriptionFlowProvider} from './providers/subscription-flow.provider'
import {MailTemplatesResolver} from './resolvers/mail-template.resolver'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowProvider,
    PrismaService,
    MailProviderService,
    MailTemplatesResolver,
    MailTemplateSyncService
  ],
  exports: [],
  imports: []
})
export class MembershipApiModule {}
