import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RatingSystemService {
  constructor(private prisma: PrismaClient) {}

  async getRatingSystem() {
    return this.prisma.commentRatingSystem.findFirst({
      include: {
        answers: true,
      },
    });
  }

  async getRatingSystemAnswers() {
    return this.prisma.commentRatingSystemAnswer.findMany();
  }

  async getUserCommentRatings(commentId: string, userId: string | null) {
    if (!userId) {
      return [];
    }

    return this.prisma.commentRating.findMany({
      where: {
        commentId,
        userId,
      },
      include: {
        answer: true,
      },
    });
  }

  async getCommentRatings(commentId: string) {
    return this.prisma.commentRating.findMany({
      where: {
        commentId,
      },
    });
  }
}
