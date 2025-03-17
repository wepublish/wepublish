import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CrowdfundingService} from './crowdfunding.service'
import {CrowdfundingResolver} from './crowdfunding.resolver'
import {CrowdfundingGoalService} from './crowdfunding-goal.service'

@Module({
  imports: [PrismaModule],
  providers: [CrowdfundingResolver, CrowdfundingService, CrowdfundingGoalService],
  exports: [CrowdfundingService]
})
export class CrowdfundingApiModule {}
