import { BadRequestException, Injectable } from '@nestjs/common';
import { ImageUploadService, UploadImageInput } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import {
  PaymentProviderCustomerInput,
  SensitiveDataUser,
  UserInput,
} from './user.model';
import { Validator } from '@wepublish/user';
import { unselectPassword } from '@wepublish/authentication/api';

@Injectable()
export class ProfileService {
  constructor(
    readonly prisma: PrismaClient,
    readonly imageService: ImageUploadService
  ) {}

  async uploadUserProfileImage(
    user: SensitiveDataUser,
    uploadImageInput: UploadImageInput | null
  ) {
    let newImage = null;
    if (uploadImageInput) {
      // update existing image
      if (user.userImageID) {
        newImage = await this.imageService.replaceImage(
          user.userImageID,
          uploadImageInput
        );
      } else {
        // create new image
        newImage = await this.imageService.uploadImage(uploadImageInput);
      }
      // cleanup existing user profile from file system
      if (newImage && user.userImageID) {
        await this.imageService.deleteImage(user.userImageID);
      }
    }

    // eventually delete image, if upload is set to null
    if (uploadImageInput === null && user.userImageID) {
      await this.imageService.deleteImage(user.userImageID);
    }

    return this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        userImageID: newImage?.id,
      },
      select: unselectPassword,
    });
  }

  async updatePublicUser(
    user: SensitiveDataUser,
    { address, name, email, birthday, firstName, flair }: UserInput
  ) {
    email = email ? (email as string).toLowerCase() : email;

    Validator.createUser.parse({ name, email, birthday, firstName });
    Validator.createAddress.parse(address);

    if (email && user.email !== email) {
      const userExists = await this.prisma.user.findUnique({
        where: { email: email as string },
      });

      if (userExists) {
        throw new BadRequestException(`Email already in use`);
      }
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        birthday,
        name,
        firstName,
        address:
          address ?
            {
              upsert: {
                create: address,
                update: address,
              },
            }
          : undefined,
        flair,
      },
      select: unselectPassword,
    });
  }

  async updatePaymentProviderCustomers(
    userId: string,
    paymentProviderCustomers: PaymentProviderCustomerInput[]
  ): Promise<SensitiveDataUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        paymentProviderCustomers: {
          deleteMany: {
            userId,
          },
          createMany: {
            data: paymentProviderCustomers,
          },
        },
      },
      select: unselectPassword,
    });
  }
}
