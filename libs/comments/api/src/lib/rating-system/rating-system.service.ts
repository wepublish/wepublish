import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  CreateCommentRatingSystemAnswerInput,
  UpdateCommentRatingSystemInput,
} from './rating-system.model';

@Injectable()
export class RatingSystemService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  getRatingSystem() {
    return this.prisma.commentRatingSystem.findFirst({
      include: {
        answers: true,
      },
    });
  }

  async updateRatingSystem({
    id,
    answers,
    ...input
  }: UpdateCommentRatingSystemInput) {
    const ratingSystem = await this.prisma.commentRatingSystem.update({
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
    await this.publicContentCache.invalidateComments();

    return ratingSystem;
  }

  async deleteRatingSystemAnswer(id: string) {
    const answer = await this.prisma.commentRatingSystemAnswer.delete({
      where: { id },
    });
    await this.publicContentCache.invalidateComments();

    return answer;
  }

  async createRatingSystemAnswer(input: CreateCommentRatingSystemAnswerInput) {
    const answer = await this.prisma.commentRatingSystemAnswer.create({
      data: input,
    });
    await this.publicContentCache.invalidateComments();

    return answer;
  }
}
