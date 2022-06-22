import {Prisma, PrismaClient} from '@prisma/client'
import {hashPassword, unselectPassword} from '../../db/user'
import {Context} from '../../context'

export const createUser = async (
  input: Omit<Prisma.UserUncheckedCreateInput, 'modifiedAt'>,
  hashCostFactor: Context['hashCostFactor'],
  user: PrismaClient['user']
) => {
  const {password, ...data} = input
  const hashedPassword = await hashPassword(password, hashCostFactor)

  return user.create({
    data: {...data, password: hashedPassword, modifiedAt: new Date()},
    select: unselectPassword
  })
}
