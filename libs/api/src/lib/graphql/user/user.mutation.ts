import {Prisma, PrismaClient, User, UserEvent} from '@prisma/client'
import {hashPassword} from '../../db/user'
import {unselectPassword} from '@wepublish/user/api'
import {Context} from '../../context'
import {Validator} from '../../validator'
import {mailLogType} from '@wepublish/mails'

export type CreateUserInput = Prisma.UserUncheckedCreateInput &
  Partial<{
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutUserInput[]
    address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null
  }>

export const createUser = async (
  {properties, address, password, ...input}: CreateUserInput,
  hashCostFactor: Context['hashCostFactor'],
  prisma: PrismaClient,
  mailContext: Context['mailContext']
) => {
  const hashedPassword = await hashPassword(password, hashCostFactor)
  input.email = input.email.toLowerCase()
  await Validator.createUser().parse(input)

  const recipient = await prisma.user.create({
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

  // send register mail
  const externalMailTemplateId = await mailContext.getUserTemplateName(UserEvent.ACCOUNT_CREATION)
  await mailContext.sendMail({
    externalMailTemplateId,
    recipient,
    optionalData: {},
    mailType: mailLogType.SystemMail
  })

  return recipient
}
