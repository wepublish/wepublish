import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {MemberPlanService} from './member-plan.service'
import {MemberPlanResolver} from './member-plan.resolver'
import {MemberPlanDataloader} from './member-plan.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [MemberPlanService, MemberPlanResolver, MemberPlanDataloader]
})
export class MemberPlanModule {}
