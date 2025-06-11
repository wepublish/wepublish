import {Injectable} from '@nestjs/common'
import {unselectPassword} from './unselect-password'
import {ImageService, UploadImageInput} from '@wepublish/image/api'
import {PrismaClient, User} from '@prisma/client'

@Injectable()
export class ProfileService {
  constructor(readonly prisma: PrismaClient, readonly imageService: ImageService) {}

  async uploadUserProfileImage(user: User, uploadImageInput: UploadImageInput | null) {
    let newImage = null
    if (uploadImageInput) {
      // update existing image
      if (user.userImageID) {
        newImage = await this.imageService.replaceImage(user.userImageID, uploadImageInput)
      } else {
        // create new image
        newImage = await this.imageService.uploadNewImage(uploadImageInput)
      }
      // cleanup existing user profile from file system
      if (newImage && user.userImageID) {
        await this.imageService.deleteImage(user.userImageID)
      }
    }

    // eventually delete image, if upload is set to null
    if (uploadImageInput === null && user.userImageID) {
      await this.imageService.deleteImage(user.userImageID)
    }

    return this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        userImageID: newImage?.id
      },
      select: unselectPassword
    })
  }
}
