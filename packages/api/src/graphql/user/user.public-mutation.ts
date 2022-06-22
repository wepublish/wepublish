import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword, unselectPassword} from '../../db/user'
import {EmailAlreadyInUseError, NotAuthenticatedError, NotFound, UserInputError} from '../../error'

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

export const updatePublicUser = async (
  input: Pick<
    Prisma.UserUncheckedUpdateInput,
    'name' | 'email' | 'firstName' | 'preferredName' | 'address'
  >,
  authenticateUser: Context['authenticateUser'],
  userClient: PrismaClient['user']
) => {
  const {user} = authenticateUser()

  const {name, email, firstName, preferredName, address} = input

  if (email && user.email !== email) {
    const userExists = await userClient.findUnique({
      where: {email: email as string}
    })

    if (userExists) throw new EmailAlreadyInUseError()
  }

  const updateUser = await userClient.update({
    where: {id: user.id},
    data: {
      name,
      firstName,
      preferredName,
      address
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
