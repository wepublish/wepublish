import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class CrowdfundingService {
  constructor(private prisma: PrismaClient) {}

  async getCrowdfundings() {
    return await this.prisma.crowdfunding.findMany({
      take: 10
    })
  }
}
