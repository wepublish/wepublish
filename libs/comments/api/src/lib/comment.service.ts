import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Comment,
  CommentAuthorType,
  CommentRating,
  CommentRatingSystemAnswer,
  CommentsRevisions,
  CommentState,
  PrismaClient,
  RatingSystemType,
} from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import { CommentSort } from './comment.model';
import { RatingSystemService } from './rating-system';
import {
  AnonymousCommentError,
  AnonymousCommentRatingDisabledError,
  AnonymousCommentsDisabledError,
  ChallengeMissingCommentError,
  CommentAuthenticationError,
  CommentLengthError,
  countRichtextChars,
  InvalidStarRatingValueError,
  NotAuthorisedError,
  NotFound,
} from '@wepublish/api';
import { CanCreateApprovedComment } from '@wepublish/permissions';
import { ChallengeService } from '@wepublish/challenge/api';
import { CommentInput, CommentUpdateInput } from './comment.input';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { CommentWithTags } from './comment.types';
import { hasPermission } from '@wepublish/permissions/api';
import { UserSession } from '@wepublish/authentication/api';
import { CalculatedRating } from './rating-system/rating-system.model';

export interface CommentWithRevisions {
  title: string | null;
  lead: string | null;
  text: string | null;

  [key: string]: any;
}

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaClient,
    private ratingSystem: RatingSystemService,
    private settingsService: SettingsService,
    private challengeService: ChallengeService
  ) {}

  async getPublicChildrenCommentsByParentId(
    parentId: string,
    userId: string | null
  ) {
    const comments = await this.prisma.comment.findMany({
      where: {
        AND: [
          { parentID: parentId },
          {
            OR: [
              userId ? { userID: userId } : {},
              { state: CommentState.approved },
            ],
          },
        ],
      },
      orderBy: {
        modifiedAt: 'desc',
      },
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
        overriddenRatings: true,
      },
    });

    return comments.map(this.mapCommentToPublicComment);
  }

  getCalculatedRatingsForComment(
    answers: CommentRatingSystemAnswer[],
    ratings: CommentRating[]
  ): CalculatedRating[] {
    return answers.map(answer => {
      const sortedRatings = ratings
        .filter(rating => rating.answerId === answer.id)
        .map(rating => rating.value)
        .sort((a, b) => a - b);
      const total = sortedRatings.reduce((value, rating) => value + rating, 0);
      const mean = total / Math.max(sortedRatings.length, 1);

      return {
        answer: {
          ...answer,
          answer: answer.answer ?? undefined,
        },
        count: sortedRatings.length,
        mean,
        total,
      };
    });
  }

  sortCommentsByRating(ascending: boolean) {
    return (comments: any[]) => {
      return [...comments].sort((a, b) => {
        const totalA = a.calculatedRatings.reduce(
          (total: number, rating: CalculatedRating) => total + rating.mean,
          0
        );
        const totalB = b.calculatedRatings.reduce(
          (total: number, rating: CalculatedRating) => total + rating.mean,
          0
        );
        const ratingDiff = ascending ? totalA - totalB : totalB - totalA;

        if (ratingDiff === 0) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }

        return ratingDiff;
      });
    };
  }

  async getPublicCommentsForItemById(
    itemId: string,
    userId: string | null,
    sort: CommentSort | null,
    order: SortOrder
  ) {
    const ratingSystem = await this.ratingSystem.getRatingSystem();
    const answers = ratingSystem?.answers || [];

    const comments = await this.prisma.comment.findMany({
      where: {
        OR: [
          { itemID: itemId, state: CommentState.approved, parentID: null },
          userId ? { itemID: itemId, userID: userId, parentID: null } : {},
        ],
      },
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
        ratings: true,
        overriddenRatings: true,
        tags: { include: { tag: true } },
      },
      orderBy: {
        createdAt: order === SortOrder.Ascending ? 'asc' : 'desc',
      },
    });

    const commentsWithRating = comments.map(comment => {
      return {
        ...this.mapCommentToPublicComment(comment),
        calculatedRatings: this.getCalculatedRatingsForComment(
          answers,
          comment.ratings || []
        ),
        tags: comment.tags?.map((t: any) => t.tag) || [],
        featured: !!comment.featured,
      };
    });

    const topComments = commentsWithRating.filter(comment => comment.featured);
    let otherComments = commentsWithRating.filter(comment => !comment.featured);

    if (sort === CommentSort.rating) {
      const isAscending = order === SortOrder.Ascending;
      otherComments = this.sortCommentsByRating(isAscending)(otherComments);
    }

    return [...topComments, ...otherComments];
  }

  async addPublicComment(input: CommentInput, session?: UserSession | null) {
    let authorType: CommentAuthorType = CommentAuthorType.verifiedUser;
    const commentLength = countRichtextChars(0, input.text);

    const maxCommentLength = (
      await this.settingsService.settingByName(SettingName.COMMENT_CHAR_LIMIT)
    )?.value as number;

    if (commentLength > maxCommentLength) {
      throw new CommentLengthError(+maxCommentLength);
    }

    const canSkipApproval = hasPermission(
      CanCreateApprovedComment,
      session?.roles ?? []
    );

    // Challenge
    if (!session?.user?.id) {
      authorType = CommentAuthorType.guestUser;

      const guestCanCommentSetting = await this.settingsService.settingByName(
        SettingName.ALLOW_GUEST_COMMENTING
      );
      if (!guestCanCommentSetting?.value) {
        throw new AnonymousCommentsDisabledError();
      }

      if (!input.guestUsername) throw new AnonymousCommentError();
      if (!input.challenge) throw new ChallengeMissingCommentError();

      const challengeValidationResult =
        await this.challengeService.validateChallenge({
          challengeID: input.challenge.challengeID,
          solution: input.challenge.challengeSolution,
        });

      if (!challengeValidationResult.valid)
        throw new CommentAuthenticationError(challengeValidationResult.message);
    }

    // Cleanup
    const { challenge: _, title, text, ...commentInput } = input;

    const comment = await this.prisma.comment.create({
      data: {
        ...commentInput,
        revisions: {
          create: {
            text: text as any,
            title,
          },
        },
        userID: session?.user.id,
        authorType,
        state:
          canSkipApproval ?
            CommentState.approved
          : CommentState.pendingApproval,
      },
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
        overriddenRatings: true,
      },
    });
    return { ...comment, title, text };
  }

  async updatePublicComment(
    input: CommentUpdateInput,
    { user, roles }: Pick<UserSession, 'user' | 'roles'>
  ) {
    const canSkipApproval = hasPermission(CanCreateApprovedComment, roles);

    const comment = await this.prisma.comment.findUnique({
      where: {
        id: input.id,
      },
      include: { revisions: { orderBy: { createdAt: 'asc' } } },
    });

    if (!comment) {
      throw new NotFound('comment', input.id);
    }

    if (user.id !== comment?.userID) {
      throw new NotAuthorisedError();
    }

    const commentEditingSetting = await this.settingsService.settingByName(
      SettingName.ALLOW_COMMENT_EDITING
    );

    if (
      !commentEditingSetting?.value &&
      comment.state !== CommentState.pendingUserChanges
    ) {
      throw new BadRequestException(
        'Comment state must be pending user changes'
      );
    }

    const { id, text, title, lead } = input;

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        revisions: {
          create: {
            text: (text ?? comment?.revisions.at(-1)?.text ?? '') as string,
            title: (title ?? comment?.revisions.at(-1)?.title ?? '') as string,
            lead: (lead ?? comment?.revisions.at(-1)?.lead ?? '') as string,
          },
        },
        state:
          canSkipApproval ?
            CommentState.approved
          : CommentState.pendingApproval,
      },
      select: {
        revisions: { orderBy: { createdAt: 'asc' } },
        overriddenRatings: true,
      },
    });

    return {
      ...updatedComment,
      text: updatedComment.revisions.at(-1)?.text,
      title: updatedComment.revisions.at(-1)?.title,
      lead: updatedComment.revisions.at(-1)?.lead,
    };
  }

  async rateComment(
    commentId: string,
    answerId: string,
    value: number,
    fingerprint: string | undefined,
    session: Pick<UserSession, 'user'> | null
  ) {
    // check if anonymous rating is allowed
    const guestRatingSetting = await this.settingsService.settingByName(
      SettingName.ALLOW_GUEST_COMMENT_RATING
    );

    if (!session && guestRatingSetting?.value !== true) {
      throw new AnonymousCommentRatingDisabledError();
    }

    const answer = await this.prisma.commentRatingSystemAnswer.findUnique({
      where: {
        id: answerId,
      },
    });

    if (!answer) {
      throw new NotFound('CommentRatingSystemAnswer', answerId);
    }

    this.validateCommentRatingValue(answer.type as RatingSystemType, value);

    await this.prisma.commentRating.upsert({
      where: {
        answerId_commentId_userId: {
          answerId,
          commentId,
          userId: session?.user.id ?? '',
        },
      },
      update: {
        fingerprint,
        value,
      },
      create: {
        answerId,
        commentId,
        userId: session?.user.id,
        value,
        fingerprint,
      },
    });

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
      },
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
        overriddenRatings: true,
      },
    });

    return comment ? this.mapCommentToPublicComment(comment) : null;
  }

  private mapCommentToPublicComment(
    comment: Comment & { revisions: CommentsRevisions[] }
  ) {
    const { revisions } = comment;

    return {
      title: revisions.length ? revisions[revisions.length - 1].title : null,
      lead: revisions.length ? revisions[revisions.length - 1].lead : null,
      text: revisions.length ? revisions[revisions.length - 1].text : null,
      ...comment,
    } as CommentWithTags;
  }

  private validateCommentRatingValue(type: RatingSystemType, value: number) {
    switch (type) {
      case RatingSystemType.star: {
        if (value <= 0 || value > 5) {
          throw new InvalidStarRatingValueError();
        }
      }
    }
  }
}
