import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaClient) {}

  async getStats() {
    const authorsCount = await this.prisma.author.count()
    const articlesCount = await this.prisma.article.count()

    const earliestArticle = await this.prisma.articleRevision.findFirst({
      where: {
        publishedAt: {
          not: null
        }
      },
      orderBy: {
        publishedAt: 'asc'
      },
      select: {
        publishedAt: true
      }
    })

    return {
      authorsCount,
      articlesCount,
      earliestArticle: earliestArticle?.publishedAt
    }
  }
}
