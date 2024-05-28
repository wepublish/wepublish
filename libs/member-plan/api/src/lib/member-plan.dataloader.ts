import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'
import {MemberPlan} from './member-plan.model'

export class MemberPlanDataloader extends DataloaderService<MemberPlan> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      (await this.prisma.memberPlan.findMany({
        where: {id: {in: ids}}
      })) as MemberPlan[],
      'id'
    )
  }
}
