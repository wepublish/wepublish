import {Prisma, PrismaClient} from '@prisma/client'
import {hashPassword, unselectPassword} from '../../db/user'
import {Context} from '../../context'
import {Validator} from '../../validator'

export type CreateUserInput = Prisma.UserUncheckedCreateInput &
  Partial<{
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutUserInput[]
    address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null
  }>

export const createUser = async (
  {properties, address, password, ...input}: CreateUserInput,
  hashCostFactor: Context['hashCostFactor'],
  user: PrismaClient['user']
) => {
  const hashedPassword = await hashPassword(password, hashCostFactor)
  input.email = input.email.toLowerCase()
  await Validator.createUser().validateAsync(input, {allowUnknown: true})

  return user.create({
    data: {
      ...input,
      password: hashedPassword,
      properties: {
        createMany: {
          data: properties ?? []
        }
      },
      address: {
        create: address ?? {}
      }
    },
    select: unselectPassword
  })
}
