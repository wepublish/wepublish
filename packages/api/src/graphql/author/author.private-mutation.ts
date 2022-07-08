import {Context} from '../../context'
import {authorise, CanDeleteAuthor} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deleteAuthorById = (
  id: string,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteAuthor, roles)

  return author.delete({
    where: {
      id
    }
  })
}
