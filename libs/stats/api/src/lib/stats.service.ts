import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaClient) {}

  async getStats() {
    const authorsCount = this.prisma.author.count()
    const articlesCount = this.prisma.article.count()

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
      stats: {
        authorsCount,
        articlesCount,
        earliestArticle
      }
    }
  }
}
