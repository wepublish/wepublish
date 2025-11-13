import { Injectable } from '@nestjs/common';
import {
  PaymentPeriodicity,
  PrismaClient,
  Crowdfunding,
  CrowdfundingGoal,
  MemberPlan,
} from '@prisma/client';
import {
  CreateCrowdfundingInput,
  UpdateCrowdfundingInput,
} from './crowdfunding.model';
import { CrowdfundingGoalWithProgress } from './crowdfunding-goal.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { CrowdfundingDataloaderService } from './crowdfunding-dataloader.service';

@Injectable()
export class CrowdfundingService {
  constructor(private prisma: PrismaClient) {}

  public getActiveGoalWithProgress({
    goals,
    revenue,
  }: {
    goals: CrowdfundingGoal[];
    revenue: number;
  }): CrowdfundingGoalWithProgress | undefined {
    const activeGoal = goals
      .sort((goalA, goalB) => goalA.amount - goalB.amount)
      .find((goal, goalIndex) => {
        const progress = (revenue * 100) / goal.amount;

        // if total amount is still 0 return first goal
        if (revenue === 0 && goalIndex === 0) {
          return true;
        }

        // progress in the middle of this goal
        if (progress < 100) {
          return true;
        }

        // last goal
        if (goalIndex + 1 === goals?.length) {
          return true;
        }

        return false;
      });

    if (!activeGoal) {
      return;
    }

    return {
      ...activeGoal,
      progress: Math.round((revenue * 100) / activeGoal.amount),
    };
  }

  public async getRevenue(
    crowdfunding: Crowdfunding,
    memberPlans: MemberPlan[]
  ): Promise<number> {
    const memberPlanIds: string[] =
      memberPlans.map(memberPlan => memberPlan.id) || [];

    const invoiceFilter = {
      some: {
        AND: [] as any[],
      },
    };

    if (crowdfunding.countSubscriptionsFrom) {
      invoiceFilter.some.AND.push({
        paidAt: {
          gte: crowdfunding.countSubscriptionsFrom.toISOString(),
        },
      });
    }

    if (crowdfunding.countSubscriptionsUntil) {
      invoiceFilter.some.AND.push({
        paidAt: {
          lte: crowdfunding.countSubscriptionsUntil.toISOString(),
        },
      });
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        memberPlanID: {
          in: memberPlanIds,
        },
        invoices: invoiceFilter,
      },
      select: {
        monthlyAmount: true,
        paymentPeriodicity: true,
      },
    });

    return (
      subscriptions.reduce((total, subscription) => {
        const monthFactor = this.calcMonthFactor(
          subscription.paymentPeriodicity
        );

        return total + subscription.monthlyAmount * monthFactor;
      }, 0) + (crowdfunding.additionalRevenue || 0)
    );
  }

  calcMonthFactor(paymentPeriodicity: PaymentPeriodicity): number {
    switch (paymentPeriodicity) {
      case 'monthly':
        return 1;
      case 'quarterly':
        return 3;
      case 'biannual':
        return 6;
      case 'yearly':
        return 12;
      case 'biennial':
        return 24;
      case 'lifetime':
        return 1200;
      default:
        return 0;
    }
  }

  @PrimeDataLoader(CrowdfundingDataloaderService)
  async getCrowdfundings() {
    return await this.prisma.crowdfunding.findMany({});
  }

  async createCrowdfunding(crowdfunding: CreateCrowdfundingInput) {
    return this.prisma.crowdfunding.create({
      data: {
        ...crowdfunding,
        goals: {
          create: crowdfunding.goals,
        },
        memberPlans: {
          connect: crowdfunding.memberPlans,
        },
      },
    });
  }

  async updateCrowdfunding(crowdfunding: UpdateCrowdfundingInput) {
    const { id, goals, memberPlans, ...crowdfundingWithoutAssociations } =
      crowdfunding;

    return await this.prisma.crowdfunding.update({
      data: {
        ...crowdfundingWithoutAssociations,
        goals: {
          deleteMany: {},
          create: goals,
        },
        memberPlans: {
          set: [],
          connect: memberPlans?.map(memberPlan => ({ id: memberPlan.id })),
        },
      },
      where: {
        id,
      },
    });
  }

  async delete(id: string): Promise<undefined> {
    await this.prisma.crowdfunding.delete({
      where: {
        id,
      },
    });
  }
}
