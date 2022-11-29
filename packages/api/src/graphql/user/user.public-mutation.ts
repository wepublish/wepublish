import {Prisma, PrismaClient, User} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword, unselectPassword} from '../../db/user'
import {EmailAlreadyInUseError, NotAuthenticatedError, NotFound, UserInputError} from '../../error'
import {Validator} from '../../validator'
import {CreateImageInput} from '../image/image.private-mutation'

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

/**
 * Uploads the user profile image and returns the image and updated user
 * @param uploadImageInput
 * @param authenticateUser
 * @param mediaAdapter
 * @param imageClient
 * @param userClient
 */
export async function uploadPublicUserProfileImage(
  uploadImageInput: CreateImageInput,
  authenticateUser: Context['authenticateUser'],
  mediaAdapter: Context['mediaAdapter'],
  imageClient: PrismaClient['image'],
  userClient: PrismaClient['user']
): Promise<null | User> {
  const {user} = authenticateUser()

  // ignore
  if (uploadImageInput === undefined) {
    return null
  }

  let newImage = null
  if (uploadImageInput) {
    // upload new image
    const {
      file,
      filename,
      title,
      description,
      tags,
      source,
      link,
      license,
      focalPoint
    } = uploadImageInput
    const {id: newImageId, ...image} = await mediaAdapter.uploadImage(file)
    const prismaImgData = {
      id: newImageId,
      ...image,
      filename: filename ?? image.filename,
      title,
      description,
      tags,
      source,
      link,
      license,
      focalPoint: {
        create: focalPoint
      }
    }
    // update existing image
    if (user.userImageID) {
      newImage = await imageClient.update({
        where: {
          id: user.userImageID
        },
        data: prismaImgData
      })
    } else {
      // create new image
      newImage = await imageClient.create({data: prismaImgData})
    }
    // cleanup existing user profile from file system
    if (newImage && user.userImageID) {
      await mediaAdapter.deleteImage(user.userImageID)
    }
  }

  // eventually delete image, if upload is set to null
  if (uploadImageInput === null && user.userImageID) {
    // delete image from file system
    await mediaAdapter.deleteImage(user.userImageID)
    // delete image from database
    await imageClient.delete({where: {id: user.userImageID}})
  }

  return await userClient.update({
    where: {
      id: user.id
    },
    data: {
      userImageID: newImage?.id
    },
    select: unselectPassword
  })
}

type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
  address: Prisma.UserAddressUncheckedUpdateWithoutUserInput
} & {uploadImageInput: CreateImageInput}

export const updatePublicUser = async (
  {address, name, email, firstName, preferredName, uploadImageInput}: UpdateUserInput,
  authenticateUser: Context['authenticateUser'],
  mediaAdapter: Context['mediaAdapter'],
  userClient: PrismaClient['user'],
  imageClient: PrismaClient['image']
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

  // eventually upload user profile image
  await uploadPublicUserProfileImage(
    uploadImageInput,
    authenticateUser,
    mediaAdapter,
    imageClient,
    userClient
  )

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
