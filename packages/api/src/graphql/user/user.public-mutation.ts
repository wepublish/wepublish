import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword, unselectPassword} from '../../db/user'
import {EmailAlreadyInUseError, NotAuthenticatedError, NotFound, UserInputError} from '../../error'
import {Validator} from '../../validator'

export const updatePaymentProviderCustomers = async (
  paymentProviderCustomers: Prisma.UserUncheckedUpdateInput['paymentProviderCustomers'],
  authenticateUser: Context['authenticateUser'],
  userClient: PrismaClient['user']
) => {
  const {user} = authenticateUser()

  const updateUser = await userClient.update({
    where: {id: user.id},
    data: {
      paymentProviderCustomers
    },
    select: unselectPassword
  })

  if (!updateUser) throw new NotFound('User', user.id)

  return updateUser.paymentProviderCustomers
}

type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
  address: Prisma.UserAddressUncheckedUpdateWithoutUserInput
}

export const updatePublicUser = async (
  {address, name, email, firstName, preferredName}: UpdateUserInput,
  authenticateUser: Context['authenticateUser'],
  userClient: PrismaClient['user']
) => {
  const {user} = authenticateUser()

  email = email ? (email as string).toLowerCase() : email

  await Validator.createUser().validateAsync(
    {address, name, email, firstName, preferredName},
    {allowUnknown: true}
  )

  if (email && user.email !== email) {
    const userExists = await userClient.findUnique({
      where: {email}
    })

    if (userExists) throw new EmailAlreadyInUseError()
  }

  const updateUser = await userClient.update({
    where: {id: user.id},
    data: {
      name,
      firstName,
      preferredName,
      address: {
        update: address
      }
    },
    select: unselectPassword
  })

  return updateUser
}

export const updateUserPassword = async (
  password: string,
  passwordRepeated: string,
  hashCostFactor: number,
  authenticateUser: Context['authenticateUser'],
  userClient: PrismaClient['user']
) => {
  const {user} = authenticateUser()
  if (!user) throw new NotAuthenticatedError()

  if (password !== passwordRepeated) {
    throw new UserInputError('password and passwordRepeat are not equal')
  }

  return userClient.update({
    where: {id: user.id},
    data: {
      password: await hashPassword(password, hashCostFactor)
    },
    select: unselectPassword
  })
}
