import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {MemberPlanService} from './member-plan.service'
import {MemberPlanResolver} from './member-plan.resolver'

@Module({
  imports: [PrismaModule],
  providers: [MemberPlanService, MemberPlanResolver],
  exports: [MemberPlanService]
})
export class MemberPlanModule {}
