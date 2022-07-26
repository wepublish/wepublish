import {Prisma, PrismaClient} from '@prisma/client'
import {hashPassword} from '../../db/user'
import {Context} from '../../context'
import {Validator} from '../../validator'

export const createUser = async (
  input: Omit<Prisma.UserUncheckedCreateInput, 'modifiedAt'>,
  hashCostFactor: Context['hashCostFactor'],
  user: PrismaClient['user']
) => {
  const {password, ...data} = input
  const hashedPassword = await hashPassword(password, hashCostFactor)
  data.email = input.email.toLowerCase()
  await Validator.createUser().validateAsync(input, {allowUnknown: true})

  return user.create({
    data: {...data, password: hashedPassword, modifiedAt: new Date()}
  })
}
