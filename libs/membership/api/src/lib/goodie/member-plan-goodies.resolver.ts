import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MemberPlan as PMemberPlan } from '@prisma/client';
import { MemberPlan } from '@wepublish/member-plan/api';
import { Goodie } from './goodie.model';
import { GoodieService } from './goodie.service';

@Resolver(() => MemberPlan)
export class MemberPlanGoodiesResolver {
  constructor(private goodieService: GoodieService) {}

  @ResolveField(() => [Goodie], {
    description:
      'Active goodies with remaining stock that can be chosen with this member plan.',
  })
  public goodies(@Parent() memberPlan: PMemberPlan) {
    return this.goodieService.getAvailableGoodiesForMemberPlan(memberPlan.id);
  }
}
