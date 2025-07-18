import {createOptionalsArray, DataLoaderService} from '@wepublish/utils/api'
import {MemberPlan, PrismaClient} from '@prisma/client'
import {Injectable, Scope} from '@nestjs/common'

@Injectable({
  scope: Scope.REQUEST
})
export class MemberPlanDataloader extends DataLoaderService<MemberPlan> {
  constructor(protected prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.memberPlan.findMany({
        where: {id: {in: ids}},
        include: {
          availablePaymentMethods: true
        }
      }),
      'id'
    )
  }
}
