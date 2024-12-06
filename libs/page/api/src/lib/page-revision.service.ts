import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class PageRevisionService {
  constructor(private prisma: PrismaClient) {}

  async getProperties(revisionId: string) {
    return this.prisma.metadataProperty.findMany({
      where: {
        pageRevisionId: revisionId
      }
    })
  }
}