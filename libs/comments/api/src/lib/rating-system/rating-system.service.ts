import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class RatingSystemService {
  constructor(private prisma: PrismaClient) {}

  async getRatingSystem() {
    return this.prisma.commentRatingSystem.findFirst({
      include: {
        answers: true
      }
    })
  }

  async getUserCommentRatings(commentId: string, userId: string | null) {
    if (!userId) {
      return []
    }

    return this.prisma.commentRating.findMany({
      where: {
        commentId,
        userId
      },
      include: {
        answer: true
      }
    })
  }
}
