import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Comment,
  CommentAuthorType,
  CommentRating,
  CommentRatingOverride,
  CommentRatingSystemAnswer,
  CommentsRevisions,
  CommentState,
  Prisma,
  PrismaClient,
  RatingSystemType,
} from '@prisma/client';
import {
  AnonymousCommentError,
  AnonymousCommentRatingDisabledError,
  AnonymousCommentsDisabledError,
  ChallengeMissingCommentError,
  CommentAuthenticationError,
  CommentLengthError,
  InvalidStarRatingValueError,
  NotAuthorisedError,
  NotFound,
} from '@wepublish/api';
import { ChallengeService } from '@wepublish/challenge/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { UserSession } from '@wepublish/authentication/api';
import { CalculatedRating } from './rating-system/rating-system.model';
import { groupBy } from 'ramda';
import {
  AddUserCommentInput,
  CommentFilter,
  CommentListArgs,
  CommentsForItemArgs,
  CommentSort,
  CreateCommentInput,
  UpdateCommentInput,
  UpdateUserCommentInput,
} from './comment.model';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';
import { hasPermission } from '@wepublish/permissions/api';
import { CanCreateApprovedComment } from '@wepublish/permissions';
import { toPlaintext } from '@wepublish/richtext';

export type CommentWithRequiredRelations = Comment & {
  ratings: (CommentRating & { answer: CommentRatingSystemAnswer })[];
  overriddenRatings: CommentRatingOverride[];
  revisions: CommentsRevisions[];
};

export type DecoratedComment = CommentWithRequiredRelations & {
  children: DecoratedComment[];
  calculatedRatings: CalculatedRating[];
};

const calculateRating = (
  answers: CommentRatingSystemAnswer[],
  ratings: CommentRating[]
) => {
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
};

const sortCommentsByRating = (
  comments: DecoratedComment[],
  order: SortOrder
) => {
  return [...comments].sort((a, b) => {
    const totalA = a.calculatedRatings.reduce(
      (total: number, rating) => total + rating.mean,
      0
    );
    const totalB = b.calculatedRatings.reduce(
      (total: number, rating) => total + rating.mean,
      0
    );
    const ratingDiff =
      order === SortOrder.Ascending ? totalA - totalB : totalB - totalA;

    if (ratingDiff === 0) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return ratingDiff;
  });
};

const sortComments = (
  comments: DecoratedComment[],
  sort: CommentSort,
  order: SortOrder
) => {
  switch (sort) {
    case CommentSort.Rating: {
      return sortCommentsByRating(comments, order);
    }
  }

  return comments;
};

const decorateComments = (
  comments: CommentWithRequiredRelations[],
  ratingSystemAnswers: CommentRatingSystemAnswer[],
  { sort, order }: { sort: CommentSort; order: SortOrder }
) => {
  const groupedComments = groupBy(
    comment => comment.parentID ?? 'null',
    comments
  );

  const decorate = (
    comment: CommentWithRequiredRelations
  ): DecoratedComment => ({
    ...comment,
    calculatedRatings: calculateRating(ratingSystemAnswers, comment.ratings),
    children: sortComments(
      (groupedComments[comment.id] ?? []).map(decorate),
      sort,
      order
    ),
  });

  return sortComments(groupedComments['null'].map(decorate), sort, order);
};

const decorateAdminComments = (
  comments: CommentWithRequiredRelations[],
  ratingSystemAnswers: CommentRatingSystemAnswer[]
) => {
  return comments.map((comment: CommentWithRequiredRelations) => ({
    ...comment,
    calculatedRatings: calculateRating(ratingSystemAnswers, comment.ratings),
    children: [],
  }));
};

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaClient,
    private settingsService: SettingsService,
    private challengeService: ChallengeService
  ) {}

  async getAdminCommennts({
    filter,
    cursorId,
    sort = CommentSort.ModifiedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: CommentListArgs) {
    const orderBy = createCommentOrder(sort, order);
    const where = createCommentFilter(filter ?? {});

    const [totalCount, comments, ratingSystemAnswers] = await Promise.all([
      this.prisma.comment.count({
        where,
        orderBy,
      }),
      this.prisma.comment.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
        include: {
          revisions: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          overriddenRatings: true,
          ratings: {
            include: {
              answer: true,
            },
          },
        },
      }),
      this.prisma.commentRatingSystemAnswer.findMany(),
    ]);

    const nodes = decorateAdminComments(
      comments.slice(0, getMaxTake(take)),
      ratingSystemAnswers
    );
    const firstComment = nodes[0];
    const lastComment = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = comments.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstComment?.id,
        endCursor: lastComment?.id,
      },
    };
  }

  public async getCommentsForItem(
    {
      itemId,
      itemType,
      order = SortOrder.Ascending,
      sort = CommentSort.Rating,
    }: CommentsForItemArgs,
    filter?: Prisma.CommentWhereInput
  ) {
    const [comments, ratingSystemAnswers] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          itemID: itemId,
          itemType,
          AND: filter ? [filter] : [],
        },
        include: {
          revisions: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          overriddenRatings: true,
          ratings: {
            include: {
              answer: true,
            },
          },
        },
      }),
      this.prisma.commentRatingSystemAnswer.findMany(),
    ]);

    return decorateComments(comments, ratingSystemAnswers, { sort, order });
  }

  public async getComment(commentId: string) {
    const [comments, ratingSystemAnswers] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          OR: [{ id: commentId }, { parentID: commentId }],
        },
        include: {
          revisions: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          overriddenRatings: true,
          ratings: {
            include: {
              answer: true,
            },
          },
        },
      }),
      this.prisma.commentRatingSystemAnswer.findMany(),
    ]);

    return decorateComments(comments, ratingSystemAnswers, {
      sort: CommentSort.Rating,
      order: SortOrder.Ascending,
    }).at(-1);
  }

  public async createAdminComment({
    text,
    lead,
    tagIds,
    ...input
  }: CreateCommentInput) {
    const comment = await this.prisma.comment.create({
      data: {
        ...input,
        state: CommentState.approved,
        authorType: CommentAuthorType.team,
        revisions: {
          create: {
            text: text as any,
            lead,
          },
        },
        tags: {
          create: tagIds?.map(tagId => ({
            tagId,
          })),
        },
      },
    });

    return this.getComment(comment.id);
  }

  public async updateAdminComment({
    id,
    tagIds,
    revision,
    ratingOverrides,
    ...input
  }: UpdateCommentInput) {
    if (ratingOverrides?.length) {
      const answerIds = ratingOverrides.map(override => override.answerId);
      const answers = await this.prisma.commentRatingSystemAnswer.findMany({
        where: {
          id: {
            in: answerIds,
          },
        },
      });

      ratingOverrides.forEach(override => {
        const answer = answers.find(a => a.id === override.answerId);

        if (!answer) {
          throw new NotFound('CommentRatingSystemAnswer', override.answerId);
        }

        this.validateCommentRatingValue(answer.type, override.value ?? 0);
      });
    }

    const comment = await this.prisma.comment.update({
      where: { id },
      data: {
        ...input,
        revisions:
          revision ?
            {
              create: {
                text: revision.text as unknown as string,
                title: revision.title,
                lead: revision.lead,
              },
            }
          : undefined,
        tags:
          tagIds ?
            {
              connectOrCreate: tagIds.map(tagId => ({
                where: {
                  commentId_tagId: {
                    commentId: id,
                    tagId,
                  },
                },
                create: {
                  tagId,
                },
              })),
              deleteMany: {
                commentId: id,
                tagId: {
                  notIn: tagIds,
                },
              },
            }
          : undefined,
        overriddenRatings: {
          upsert: ratingOverrides?.map(override => ({
            where: {
              answerId_commentId: {
                answerId: override.answerId,
                commentId: id,
              },
            },
            create: {
              answerId: override.answerId,
              value: override.value,
            },
            update: {
              value: override.value ?? null,
            },
          })),
        },
      },
    });

    return this.getComment(comment.id);
  }

  deleteComment(id: string) {
    return this.prisma.comment.delete({
      where: {
        id,
      },
    });
  }

  async takeActionOnComment(
    id: string,
    input: Pick<Comment, 'state' | 'rejectionReason'>
  ) {
    await this.prisma.comment.update({
      where: { id },
      data: input,
    });

    return this.getComment(id);
  }

  async addUserComment(
    input: AddUserCommentInput,
    session?: UserSession | null
  ) {
    let authorType: CommentAuthorType = CommentAuthorType.verifiedUser;
    const commentLength = toPlaintext(input.text)?.length ?? 0;

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

      if (!input.guestUsername) {
        throw new AnonymousCommentError();
      }

      if (!input.challenge) {
        throw new ChallengeMissingCommentError();
      }

      const challengeValidationResult =
        await this.challengeService.validateChallenge({
          challengeID: input.challenge.challengeID,
          solution: input.challenge.challengeSolution,
        });

      if (!challengeValidationResult.valid) {
        throw new CommentAuthenticationError(challengeValidationResult.message);
      }
    }

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
    });

    return this.getComment(comment.id);
  }

  async updateUserComment(
    input: UpdateUserCommentInput,
    { user, roles }: UserSession
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
    });

    return this.getComment(updatedComment.id);
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

    return this.getComment(commentId);
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

export const createCommentOrder = (
  field: CommentSort,
  sortOrder: SortOrder
): Prisma.CommentFindManyArgs['orderBy'] => {
  switch (field) {
    case CommentSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    default:
    case CommentSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTagFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tags,
          },
        },
      },
    };
  }

  return {};
};

const createStateFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.states) {
    return {
      state: {
        in: filter.states,
      },
    };
  }

  return {};
};

const createItemFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.item) {
    return {
      itemID: filter.item,
    };
  }

  return {};
};

const createItemTypeFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.itemType) {
    return {
      itemType: {
        equals: filter.itemType,
      },
    };
  }

  return {};
};

const createItemIdFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter.itemID) {
    return {
      itemID: {
        equals: filter.itemID,
      },
    };
  }

  return {};
};

export const createCommentFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => ({
  AND: [
    createStateFilter(filter),
    createTagFilter(filter),
    createItemTypeFilter(filter),
    createItemIdFilter(filter),
    createItemFilter(filter),
  ],
});
