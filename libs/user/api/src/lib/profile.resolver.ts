import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  actingUserOf,
  Authenticated,
  AuthSession,
  CurrentUser,
  requireUserSession,
  UserSession,
} from '@wepublish/authentication/api';
import { SensitiveDataUser } from './user.model';
import { UploadImageInput } from '@wepublish/image/api';
import { ProfileService } from './profile.service';
import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';

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
  async me(@CurrentUser() session: AuthSession | undefined) {
    return actingUserOf(session);
  }

  @Authenticated()
  @Mutation(() => SensitiveDataUser, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`,
  })
  async updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() session: AuthSession
  ) {
    const { id, user } = requireUserSession(session);

    if (password !== passwordRepeated) {
      throw new BadRequestException(
        'password and passwordRepeated are not equal'
      );
    }

    await this.userService.validatePassword(password);

    return this.userService.updateUserPassword(user.id, password, {
      keepSessionId: id,
    });
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

  @Authenticated()
  @Mutation(() => Boolean, {
    description:
      'Requests an email change. A confirmation link is sent to the current email address.',
  })
  async requestEmailChange(
    @Args('newEmail') newEmail: string,
    @CurrentUser() session: AuthSession
  ): Promise<boolean> {
    const { user } = requireUserSession(session);

    await this.userService.requestEmailChange(user.id, newEmail);
    return true;
  }

  @Authenticated()
  @Mutation(() => SensitiveDataUser, {
    description: 'Confirms a pending email change for the logged-in user.',
  })
  async confirmEmailChange(
    @Args('newEmail') newEmail: string,
    @CurrentUser() session: AuthSession
  ) {
    const { user } = requireUserSession(session);

    return this.userService.confirmEmailChange(user.id, newEmail);
  }
}
