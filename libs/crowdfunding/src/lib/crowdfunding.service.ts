import {Injectable, NotFoundException} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {CreateCrowdfundingInput, UpdateCrowdfundingInput} from './crowdfunding.model'

@Injectable()
export class CrowdfundingService {
  constructor(private prisma: PrismaClient) {}

  async getCrowdfundingById(id: string) {
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

    return crowdfunding
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
    return this.prisma.crowdfunding.update({
      data: {
        ...crowdfunding
      },
      where: {
        id: crowdfunding.id
      },
      include: {
        goals: true,
        memberPlans: true
      }
    })
  }
}
