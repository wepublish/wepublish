import {
  CommentAuthorType,
  CommentItemType,
  CommentState,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { Context } from '../../context';
import { NotFound } from '../../error';
import { validateCommentRatingValue } from '../comment-rating/comment-rating.public-mutation';
import { authorise } from '../permissions';
import {
  CanDeleteComments,
  CanTakeActionOnComment,
  CanUpdateComments,
} from '@wepublish/permissions';
import { RichTextNode } from '@wepublish/richtext/api';

export const takeActionOnComment = (
  id: string,
  input: Pick<Prisma.CommentUncheckedUpdateInput, 'state' | 'rejectionReason'>,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanTakeActionOnComment, roles);

  return comment.update({
    where: { id },
    data: input,
    include: {
      revisions: { orderBy: { createdAt: 'asc' } },
    },
  });
};

type CommentRevisionInput = {
  text?: RichTextNode[];
  title?: string;
  lead?: string;
};

type CommentRatingOverrideInput = {
  answerId: string;
  value: number | null | undefined;
};

export const updateComment = async (
  commentId: string,
  revision: CommentRevisionInput | undefined,
  userID: string,
  guestUsername: string,
  guestUserImageID: string,
  source: string,
  featured: boolean,
  tagIds: string[] | undefined,
  ratingOverrides: CommentRatingOverrideInput[] | undefined,
  authenticate: Context['authenticate'],
  commentRatingAnswerClient: PrismaClient['commentRatingSystemAnswer'],
  commentClient: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanUpdateComments, roles);

  if (ratingOverrides?.length) {
    const answerIds = ratingOverrides.map(override => override.answerId);
    const answers = await commentRatingAnswerClient.findMany({
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

      validateCommentRatingValue(answer.type, override.value ?? 0);
    });
  }

  return commentClient.update({
    where: { id: commentId },
    data: {
      userID,
      guestUsername,
      guestUserImageID,
      featured,
      source,
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
                  commentId,
                  tagId,
                },
              },
              create: {
                tagId,
              },
            })),
            deleteMany: {
              commentId,
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
              commentId,
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
    include: {
      revisions: { orderBy: { createdAt: 'asc' } },
      overriddenRatings: true,
    },
  });
};

export const createAdminComment = async (
  itemId: string,
  itemType: CommentItemType,
  parentID: string | undefined | null,
  text: string | undefined,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanUpdateComments, roles);

  return commentClient.create({
    data: {
      state: CommentState.pendingApproval,
      authorType: CommentAuthorType.team,
      itemID: itemId,
      itemType,
      parentID,
      revisions:
        text ?
          {
            create: {
              text,
            },
          }
        : undefined,
      tags: {
        create: tagIds?.map(tagId => ({
          tagId,
        })),
      },
    },
    include: {
      revisions: { orderBy: { createdAt: 'asc' } },
    },
  });
};

export const deleteComment = async (
  id: string,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanDeleteComments, roles);

  return commentClient.delete({
    where: {
      id,
    },
  });
};
