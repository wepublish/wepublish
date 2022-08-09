import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanTakeActionOnComment} from '../permissions'

export const takeActionOnComment = (
  id: string,
  input: Pick<Prisma.CommentUncheckedUpdateInput, 'state' | 'rejectionReason'>,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanTakeActionOnComment, roles)

  return comment.update({
    where: {id},
    data: input
  })
}
