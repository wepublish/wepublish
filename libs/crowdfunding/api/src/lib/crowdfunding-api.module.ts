import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CrowdfundingService} from './crowdfunding.service'
import {CrowdfundingResolver} from './crowdfunding.resolver'
import {CrowdfundingGoalService} from './crowdfunding-goal.service'
import {
  HasCrowdfundingResolver,
  HasOptionalCrowdfundingResolver
} from './has-crowdfunding/has-crowdfunding.resolver'
import {CrowdfundingDataloaderService} from './crowdfunding-dataloader.service'

@Module({
  imports: [PrismaModule],
  providers: [
    CrowdfundingResolver,
    CrowdfundingService,
    CrowdfundingGoalService,
    CrowdfundingDataloaderService,
    HasCrowdfundingResolver,
    HasOptionalCrowdfundingResolver
  ],
  exports: [CrowdfundingService, CrowdfundingDataloaderService]
})
export class CrowdfundingApiModule {}
