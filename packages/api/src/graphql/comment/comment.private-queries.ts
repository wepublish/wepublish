import {authorise, CanGetComments} from '../permissions'
import {Context} from '../../context'
import {CommentFilter, CommentSort} from '../../db/comment'
import {PrismaClient} from '@prisma/client'
import {getComments} from './comment.queries'

export const getAdminComments = async (
  filter: Partial<CommentFilter>,
  sortedField: CommentSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanGetComments, roles)

  return getComments(filter, sortedField, order, cursorId, skip, take, comment)
}
