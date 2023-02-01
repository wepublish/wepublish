import {Module} from '@nestjs/common'
import {MailProviderService, MailTemplateSyncService, PrismaService} from '@wepublish/api'
import {SubscriptionFlows} from './providers/subscription-flows'
import {MailTemplatesResolver} from './resolvers/mail-template.resolver'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlows,
    PrismaService,
    MailProviderService,
    MailTemplatesResolver,
    MailTemplateSyncService
  ],
  exports: [],
  imports: []
})
export class MembershipApiModule {}
