import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateCommentRatingSystemAnswerInput,
  UpdateCommentRatingSystemInput,
} from './rating-system.model';

@Injectable()
export class RatingSystemService {
  constructor(private prisma: PrismaClient) {}

  getRatingSystem() {
    return this.prisma.commentRatingSystem.findFirst({
      include: {
        answers: true,
      },
    });
  }

  getRatingSystemAnswers() {
    return this.prisma.commentRatingSystemAnswer.findMany();
  }

  getUserCommentRatings(commentId: string, userId: string) {
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

  getCommentRatings(commentId: string) {
    return this.prisma.commentRating.findMany({
      where: {
        commentId,
      },
    });
  }

  updateRatingSystem({
    id,
    answers,
    ...input
  }: UpdateCommentRatingSystemInput) {
    return this.prisma.commentRatingSystem.update({
      where: { id },
      data: {
        ...input,
        answers: {
          update: answers?.map(answer => ({
            where: { id: answer.id },
            data: answer,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  }

  deleteRatingSystemAnswer(id: string) {
    return this.prisma.commentRatingSystemAnswer.delete({
      where: { id },
    });
  }

  createRatingSystemAnswer(input: CreateCommentRatingSystemAnswerInput) {
    return this.prisma.commentRatingSystemAnswer.create({
      data: input,
    });
  }
}
