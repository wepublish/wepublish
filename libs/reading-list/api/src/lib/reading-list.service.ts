import {Injectable, NotFoundException} from '@nestjs/common'
import {PrismaClient, User} from '@prisma/client'
import {ReadingListProgressArgs} from './reading-list.model'

@Injectable()
export class ReadingListService {
  constructor(private prisma: PrismaClient) {}

  async saveProgress(user: User, {articleId, blockIndex, completed}: ReadingListProgressArgs) {
    const article = await this.prisma.article.findUnique({
      where: {
        id: articleId
      }
    })

    if (!article) {
      throw new NotFoundException()
    }

    const progress = await this.prisma.readingList.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id
        }
      }
    })

    if (progress?.completed) {
      return false
    }

    return this.prisma.readingList.upsert({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id
        }
      },
      create: {
        articleId,
        userId: user.id,
        blockIndex,
        completed
      },
      update: {
        blockIndex,
        completed
      }
    })
  }
}
