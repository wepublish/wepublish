import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  AuthSessionType,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { SensitiveDataUser } from './user.model';
import { UploadImageInput } from '@wepublish/image/api';
import { ProfileService } from './profile.service';
import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { Validator } from '@wepublish/user';

@Resolver()
export class ProfileResolver {
  constructor(
    private userService: UserService,
    private profileService: ProfileService
  ) {}

  @Authenticated()
  @Query(() => SensitiveDataUser, {
    description: `This query returns the user.`,
    nullable: true,
  })
  async me(@CurrentUser() session: UserSession) {
    if (session?.type !== AuthSessionType.User) {
      return null;
    }

    return session.user;
  }

  @Authenticated()
  @Mutation(() => SensitiveDataUser, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`,
  })
  async updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() { user }: UserSession
  ) {
    if (password !== passwordRepeated) {
      throw new BadRequestException(
        'password and passwordRepeated are not equal'
      );
    }

    await Validator.password.parseAsync(password);

    return this.userService.updateUserPassword(user.id, password);
  }

  @Authenticated()
  @Mutation(() => SensitiveDataUser, {
    nullable: true,
    description: `This mutation allows to upload and update the user's profile image.`,
  })
  async uploadUserProfileImage(
    @Args() uploadImageInput: UploadImageInput,
    @CurrentUser() session: UserSession
  ) {
    return this.profileService.uploadUserProfileImage(
      session.user,
      uploadImageInput
    );
  }
}
