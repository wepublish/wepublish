import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { CrowdfundingService } from './crowdfunding.service';
import { CrowdfundingResolver } from './crowdfunding.resolver';
import {
  HasCrowdfundingResolver,
  HasOptionalCrowdfundingResolver,
} from './has-crowdfunding/has-crowdfunding.resolver';
import { CrowdfundingDataloaderService } from './crowdfunding-dataloader.service';
import { CrowdfundingGoalDataloader } from './crowdfunding-goal.dataloader';
import { CrowdfundingMemberPlanDataloader } from './crowdfunding-memberplan.dataloader';

@Module({
  imports: [PrismaModule],
  providers: [
    CrowdfundingResolver,
    CrowdfundingService,
    CrowdfundingDataloaderService,
    CrowdfundingGoalDataloader,
    CrowdfundingMemberPlanDataloader,
    HasCrowdfundingResolver,
    HasOptionalCrowdfundingResolver,
  ],
  exports: [CrowdfundingService, CrowdfundingDataloaderService],
})
export class CrowdfundingModule {}
