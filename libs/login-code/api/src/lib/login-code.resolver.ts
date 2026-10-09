import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { CanManageUserLoginCodes } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { UserLoginCodeIssue, UserLoginCodeStatus } from './login-code.model';
import { LoginCodeService } from './login-code.service';
import { LoginCodeSecondFactorService } from './login-code-second-factor.service';

@Resolver()
export class LoginCodeResolver {
  constructor(
    private loginCodeService: LoginCodeService,
    private secondFactorService: LoginCodeSecondFactorService,
    private prisma: PrismaClient
  ) {}

  private async withSecondFactor<T extends object>(
    userId: string,
    status: T
  ): Promise<
    T & Pick<UserLoginCodeStatus, 'secondFactor' | 'secondFactorAvailable'>
  > {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    return {
      ...status,
      secondFactor: await this.secondFactorService.getFactor(),
      secondFactorAvailable:
        user ? await this.secondFactorService.isAvailable(user) : false,
    };
  }

  @Permissions(CanManageUserLoginCodes)
  @Query(() => UserLoginCodeStatus, {
    nullable: true,
    description:
      'The current personal login link of a user, without the code itself.',
  })
  async userLoginCode(@Args('userId') userId: string) {
    const status = await this.loginCodeService.statusFor(userId);

    return status ? this.withSecondFactor(userId, status) : null;
  }

  @Permissions(CanManageUserLoginCodes)
  @Mutation(() => Boolean, {
    description: 'Revokes all personal login links of a user.',
  })
  async revokeUserLoginCode(
    @Args('userId') userId: string,
    @CurrentUser() session: UserSession
  ) {
    await this.loginCodeService.revoke(userId, `editor:${session.user.id}`);

    return true;
  }

  @Permissions(CanManageUserLoginCodes)
  @Mutation(() => UserLoginCodeIssue, {
    description:
      'Revokes existing personal login links of a user and issues a new one. The code is returned exactly once.',
  })
  async reissueUserLoginCode(
    @Args('userId') userId: string,
    @CurrentUser() session: UserSession
  ): Promise<UserLoginCodeIssue> {
    const issue = await this.loginCodeService.reissue(
      userId,
      `editor:${session.user.id}`
    );

    return {
      ...issue,
      status: await this.withSecondFactor(userId, issue.status),
    };
  }
}
