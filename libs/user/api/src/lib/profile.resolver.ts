import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  AuthenticationService,
  AuthSessionType,
  Authenticated,
  CurrentUser,
  Public,
  RequiresFullSession,
  UserSession,
} from '@wepublish/authentication/api';
import {
  LoginCodeSecondFactorService,
  TooManyAttemptsError,
} from '@wepublish/login-code/api';
import { SensitiveDataUser } from './user.model';
import { UploadImageInput } from '@wepublish/image/api';
import { ProfileService } from './profile.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';

export const EMAIL_VERIFICATION_REQUIRED = 'EMAIL_VERIFICATION_REQUIRED';

@Resolver()
export class ProfileResolver {
  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private secondFactorService: LoginCodeSecondFactorService,
    private authenticationService: AuthenticationService
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

    return session.restricted ?
        this.secondFactorService.mask(session.user)
      : session.user;
  }

  @RequiresFullSession()
  @Mutation(() => SensitiveDataUser, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`,
  })
  async updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() { id, user }: UserSession
  ) {
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
      'Requests an email change. A confirmation link is sent to the new email address. A restricted session must also confirm the configured second factor from the letter.',
  })
  async requestEmailChange(
    @Args('newEmail') newEmail: string,
    @CurrentUser() session: UserSession,
    @Args('secondFactor', { nullable: true }) secondFactor?: string
  ): Promise<boolean> {
    if (session.restricted && !session.placeholderEmail) {
      throw new ForbiddenException(EMAIL_VERIFICATION_REQUIRED);
    }

    if (session.restricted) {
      await this.assertSecondFactor(session, secondFactor);
    }

    await this.userService.requestEmailChange(session.user.id, newEmail);
    return true;
  }

  private async assertSecondFactor(
    session: UserSession,
    secondFactor: string | undefined
  ) {
    try {
      await this.secondFactorService.assert(session.user, secondFactor);
    } catch (error) {
      if (error instanceof TooManyAttemptsError) {
        await this.authenticationService.revokeUserSessions(session.user.id);
      }

      throw error;
    }
  }

  @Authenticated()
  @Mutation(() => Boolean, {
    description:
      'Sends a confirmation link to the current email address to verify it.',
  })
  async requestEmailVerification(
    @CurrentUser() { user }: UserSession
  ): Promise<boolean> {
    await this.userService.requestEmailVerification(user.id);
    return true;
  }

  @Public()
  @Mutation(() => SensitiveDataUser, {
    description:
      'Confirms a pending email change with the token from the confirmation email.',
  })
  async confirmEmailChange(
    @Args('token') token: string,
    @CurrentUser() session?: UserSession
  ) {
    return this.userService.confirmEmailChange(token, {
      exceptSessionToken:
        session?.type === AuthSessionType.User ? session.token : undefined,
    });
  }
}
