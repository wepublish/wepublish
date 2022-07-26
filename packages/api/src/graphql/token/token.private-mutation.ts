import {Context} from '../../context'
import {authorise, CanCreateToken, CanDeleteToken} from '../permissions'
import {PrismaClient, Prisma} from '@prisma/client'

export const deleteTokenById = (
  id: string,
  authenticate: Context['authenticate'],
  token: PrismaClient['token']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteToken, roles)

  return token.delete({
    where: {
      id
    }
  })
}

export const createToken = (
  input: Omit<Prisma.TokenUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  token: PrismaClient['token']
) => {
  const {roles} = authenticate()
  authorise(CanCreateToken, roles)

  return token.create({
    data: {...input, modifiedAt: new Date()}
  })
}
