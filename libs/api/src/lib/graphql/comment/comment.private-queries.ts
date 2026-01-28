import { authorise } from '../permissions';
import { CanGetComments } from '@wepublish/permissions';
import { Context } from '../../context';
import { CommentFilter, CommentSort } from '../../db/comment';
import { PrismaClient } from '@prisma/client';
import { getComments } from './comment.queries';
import { SortOrder } from '@wepublish/utils/api';

export const getComment = (
  commentId: string,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanGetComments, roles);

  return comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      overriddenRatings: true,
      revisions: { orderBy: { createdAt: 'asc' } },
    },
  });
};

export const getAdminComments = async (
  filter: Partial<CommentFilter>,
  sortedField: CommentSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const { roles } = authenticate();
  authorise(CanGetComments, roles);

  return getComments(filter, sortedField, order, cursorId, skip, take, comment);
};
