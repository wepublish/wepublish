import {Injectable, NotFoundException} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {
  CreateCrowdfundingInput,
  CrowdfundingWithActiveGoal,
  UpdateCrowdfundingInput
} from './crowdfunding.model'
import {CrowdfundingGoalWithProgress} from './crowdfunding-goal.model'

@Injectable()
export class CrowdfundingService {
  constructor(private prisma: PrismaClient) {}

  async getCrowdfundingById(id: string): Promise<CrowdfundingWithActiveGoal> {
    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: {
        id
      },
      include: {
        goals: true,
        memberPlans: true
      }
    })
    if (!crowdfunding) throw new NotFoundException()

    return {
      ...crowdfunding,
      activeCrowdfundingGoal: await this.getActiveGoalWithProgress({crowdfunding})
    }
  }

  public async getActiveGoalWithProgress({
    crowdfunding
  }: {
    crowdfunding: CrowdfundingWithActiveGoal
  }): Promise<CrowdfundingGoalWithProgress | undefined> {
    const totalAmount = await this.getTotalAmount({crowdfunding})

    const activeGoal = crowdfunding.goals
      ?.sort((goalA, goalB) => {
        return goalA.amount - goalB.amount
      })
      ?.find((goal, goalIndex) => {
        const progress = (totalAmount * 100) / goal.amount
        console.log('progress', totalAmount, goal.amount)

        // if total amount is still 0 return first goal
        if (totalAmount === 0 && goalIndex === 0) {
          return true
        }

        // progress in the middle of this goal
        if (progress < 100) {
          return true
        }

        // last goal
        if (goalIndex + 1 === crowdfunding.goals?.length) {
          return true
        }
      })

    if (!activeGoal) {
      return
    }

    return {
      ...activeGoal,
      progress: Math.round((totalAmount * 100) / activeGoal.amount)
    }
  }

  private async getTotalAmount({
    crowdfunding
  }: {
    crowdfunding: CrowdfundingWithActiveGoal
  }): Promise<number> {
    const memberPlanIds: string[] = crowdfunding.memberPlans?.map(memberPlan => memberPlan.id) || []

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        memberPlanID: {
          in: memberPlanIds
        }
      },
      select: {
        monthlyAmount: true
      }
    })

    return subscriptions
      .map(subscription => subscription.monthlyAmount)
      .reduce((total, monthlyAmount) => total + monthlyAmount, 0)
  }

  async getCrowdfundings() {
    return await this.prisma.crowdfunding.findMany({
      include: {
        goals: true,
        memberPlans: true
      }
    })
  }

  async createCrowdfunding(crowdfunding: CreateCrowdfundingInput) {
    return this.prisma.crowdfunding.create({
      data: {
        ...crowdfunding,
        goals: {
          create: crowdfunding.goals
        },
        memberPlans: {
          connect: crowdfunding.memberPlans
        }
      },
      include: {
        goals: true,
        memberPlans: true
      }
    })
  }

  async updateCrowdfunding(crowdfunding: UpdateCrowdfundingInput) {
    const {id, goals, memberPlans, ...crowdfundingWithoutAssociations} = crowdfunding

    return this.prisma.crowdfunding.update({
      data: {
        ...crowdfundingWithoutAssociations,
        goals: {
          deleteMany: {},
          create: goals
        },
        memberPlans: {
          set: [],
          connect: memberPlans?.map(memberPlan => ({id: memberPlan.id}))
        }
      },
      where: {
        id
      },
      include: {
        goals: true,
        memberPlans: true
      }
    })
  }

  async delete(id: string): Promise<undefined> {
    await this.prisma.crowdfunding.delete({
      where: {
        id
      }
    })
  }
}
