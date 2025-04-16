import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {
  CrowdfundingGoal,
  CrowdfundingGoalArgs,
  CreateCrowdfundingGoalInput,
  UpdateCrowdfundingGoalInput
} from './crowdfunding-goal.model'
import {Crowdfunding} from './crowdfunding.model'

@Injectable()
export class CrowdfundingGoalService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string): Promise<CrowdfundingGoal | null> {
    return this.prisma.crowdfundingGoal.findUnique({
      where: {
        id
      }
    })
  }

  async findAll(args: CrowdfundingGoalArgs): Promise<CrowdfundingGoal[]> {
    return this.prisma.crowdfundingGoal.findMany({
      where: {
        crowdfundingId: args.crowdfundingId
      }
    })
  }

  async create(
    crowdfunding: Crowdfunding,
    input: CreateCrowdfundingGoalInput
  ): Promise<CrowdfundingGoal> {
    return this.prisma.crowdfundingGoal.create({
      data: {
        ...input,
        crowdfundingId: crowdfunding.id
      }
    })
  }

  async update(params: UpdateCrowdfundingGoalInput): Promise<CrowdfundingGoal> {
    const {id, ...params_without_id} = params

    return this.prisma.crowdfundingGoal.update({
      where: {
        id
      },
      data: {
        ...params_without_id
      }
    })
  }

  async delete(id: string): Promise<undefined> {
    this.prisma.crowdfundingGoal.delete({
      where: {
        id
      }
    })
  }
}
