import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CrowdfundingService} from './crowdfunding.service'
import {CrowdfundingResolver} from './crowdfunding.resolver'

@Module({
  imports: [PrismaModule],
  providers: [CrowdfundingResolver, CrowdfundingService],
  exports: [CrowdfundingService]
})
export class CrowdfundingModule {}
