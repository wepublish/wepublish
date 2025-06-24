import {BadRequestException, Injectable} from '@nestjs/common'
import {PrismaClient, User} from '@prisma/client'
import {ReadingListProgressArgs} from './reading-list.model'

@Injectable()
export class ReadingListService {
  constructor(private prisma: PrismaClient) {}

  async saveProgress(user: User, {articleId, blockIndex}: ReadingListProgressArgs) {
    const article = await this.prisma.article.findUnique({
      where: {
        id: articleId
      },
      include: {
        revisions: {
          select: {
            blocks: true
          },
          take: 1,
          orderBy: [
            {
              publishedAt: 'desc'
            },
            {
              createdAt: 'desc'
            }
          ],
          where: {
            AND: [
              {
                publishedAt: {
                  not: null
                }
              },
              {
                publishedAt: {
                  lte: new Date()
                }
              }
            ]
          }
        }
      }
    })

    if (!article?.revisions[0]) {
      throw new BadRequestException()
    }

    const completed = blockIndex >= (article.revisions[0].blocks as any[]).length

    return this.prisma.readingList.upsert({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id
        },
        completed: false
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
