import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateToken, CanDeleteToken} from '@wepublish/permissions/api'
import {PrismaClient, Prisma} from '@prisma/client'
import {generateToken} from '../session/session.mutation'

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
  input: Omit<Prisma.TokenUncheckedCreateInput, 'token' | 'modifiedAt'>,
  authenticate: Context['authenticate'],
  token: PrismaClient['token']
) => {
  const {roles} = authenticate()
  authorise(CanCreateToken, roles)

  return token.create({
    data: {...input, token: generateToken()}
  })
}
