import { Injectable } from '@nestjs/common';
import { ImageUploadService, UploadImageInput } from '@wepublish/image/api';
import { PrismaClient, User } from '@prisma/client';
import {
  SessionCacheInvalidator,
  unselectPassword,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';

@Injectable()
export class ProfileService {
  constructor(
    readonly prisma: PrismaClient,
    readonly imageService: ImageUploadService,
    private sessionCache: SessionCacheInvalidator,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  async uploadUserProfileImage(
    user: User,
    uploadImageInput: UploadImageInput | null
  ) {
    let newImage = null;
    if (uploadImageInput) {
      // update existing image
      if (user.userImageID) {
        newImage = await this.imageService.replaceImage(
          user.userImageID,
          uploadImageInput,
          { profileImage: true }
        );
      } else {
        // create new image
        newImage = await this.imageService.uploadImage(uploadImageInput);
      }
    }

    // eventually delete image, if upload is set to null
    if (uploadImageInput === null && user.userImageID) {
      await this.imageService.deleteImage(user.userImageID, {
        profileImage: true,
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        userImageID: newImage?.id,
      },
      select: unselectPassword,
    });
    await this.sessionCache.invalidate();

    if (newImage || (uploadImageInput === null && user.userImageID)) {
      await this.publicContentCache.invalidateComments();
    }

    return updatedUser;
  }
}
