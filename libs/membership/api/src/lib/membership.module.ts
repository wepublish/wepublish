import {Module} from '@nestjs/common'
import {SubscriptionFlowModule} from './subscription-flow/subscription-flow.module'
import {MailTemplateModule} from './mail-template/mail-template.module'
import {DashboardModule} from './dashboard/dashboard.module'

@Module({
  imports: [SubscriptionFlowModule, MailTemplateModule, DashboardModule]
})
export class MembershipModule {}
