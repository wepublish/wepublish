import {Prisma, PrismaClient, User} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword} from '../../db/user'
import {unselectPassword} from '@wepublish/user/api'
import {EmailAlreadyInUseError, NotAuthenticatedError, NotFound, UserInputError} from '../../error'
import {Validator} from '../../validator'
import {CreateImageInput} from '../image/image.private-mutation'

type UpdatePaymentProviderCustomers = {
  paymentProviderID: string
  customerID: string
}[]

export const updatePaymentProviderCustomers = async (
  paymentProviderCustomers: UpdatePaymentProviderCustomers,
  authenticateUser: Context['authenticateUser'],
  userClient: PrismaClient['user']
) => {
  const {user} = authenticateUser()

  const updateUser = await userClient.update({
    where: {id: user.id},
    data: {
      paymentProviderCustomers: {
        deleteMany: {
          userId: user.id
        },
        createMany: {
          data: paymentProviderCustomers
        }
      }
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
    const {file, filename, title, description, tags, source, link, license, focalPoint} =
      uploadImageInput
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
  address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null
} & {uploadImageInput: CreateImageInput}

export const updatePublicUser = async (
  {address, name, email, firstName, preferredName, flair, uploadImageInput}: UpdateUserInput,
  authenticateUser: Context['authenticateUser'],
  mediaAdapter: Context['mediaAdapter'],
  userClient: PrismaClient['user'],
  imageClient: PrismaClient['image']
) => {
  const {user} = authenticateUser()

  email = email ? (email as string).toLowerCase() : email

  await Validator.createUser().parse({address, name, email, firstName, preferredName})

  if (email && user.email !== email) {
    const userExists = await userClient.findUnique({
      where: {email: email as string}
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
      address: address
        ? {
            upsert: {
              create: address,
              update: address
            }
          }
        : undefined,
      flair
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
