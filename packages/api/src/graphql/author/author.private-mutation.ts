import {Context} from '../../context'
import {authorise, CanDeleteAuthor, CanCreateAuthor} from '../permissions'
import {PrismaClient, Prisma} from '@prisma/client'

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

export const createAuthor = (
  input: Omit<Prisma.AuthorUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const {roles} = authenticate()
  authorise(CanCreateAuthor, roles)

  return author.create({
    data: {...input, modifiedAt: new Date()}
  })
}
