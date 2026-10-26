import { UnauthorizedException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  actingUserOf,
  AuthSession,
  CurrentUser,
  requireUserSession,
} from '@wepublish/authentication/api';
import {
  CanCreateApiToken,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanRevokeAllApiTokens,
  CanRevokeApiToken,
} from '@wepublish/permissions';
import {
  hasPermission,
  Permissions,
  permissionsOf,
} from '@wepublish/permissions/api';
import { User, UserDataloaderService } from '@wepublish/user/api';

import {
  ApiToken,
  ApiTokenListArgs,
  CreateApiTokenArgs,
  CreatedApiToken,
  PaginatedApiTokens,
} from './api-token.model';
import { ApiTokenService } from './api-token.service';

@Resolver(() => ApiToken)
export class ApiTokenResolver {
  constructor(
    private service: ApiTokenService,
    private userDataloader: UserDataloaderService
  ) {}

  @ResolveField(() => User, {
    nullable: true,
    description: `The user who created this token. Null once that user is deleted.`,
  })
  public createdBy(@Parent() apiToken: ApiToken) {
    if (!apiToken.createdById) {
      return null;
    }

    return this.userDataloader.load(apiToken.createdById);
  }

  @Permissions(CanGetApiTokens)
  @Query(() => PaginatedApiTokens, {
    description: `Returns your own api tokens, or everyone's with CAN_GET_ALL_API_TOKENS. Secrets are never included.`,
  })
  public async apiTokens(
    @Args() args: ApiTokenListArgs,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const user = actingUserOf(session);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.service.getApiTokens(args, {
      userId: user.id,
      canSeeAll: hasPermission(CanGetAllApiTokens, permissionsOf(session)),
    });
  }

  @Permissions(CanCreateApiToken)
  @Mutation(() => CreatedApiToken, {
    description: `Creates an api token and returns its secret. The secret is shown once and cannot be retrieved again.`,
  })
  public async createApiToken(
    @Args() args: CreateApiTokenArgs,
    @CurrentUser() currentSession: AuthSession | undefined
  ) {
    if (!currentSession) {
      throw new UnauthorizedException();
    }

    const session = requireUserSession(currentSession);

    return this.service.createToken(args, {
      userId: session.user.id,
      permissions: session.roles.flatMap(role => role.permissionIDs),
      organizationIds: session.organizationIds,
    });
  }

  @Permissions(CanRevokeApiToken)
  @Mutation(() => ApiToken, {
    description: `Revokes one of your api tokens, or anyone's with CAN_REVOKE_ALL_API_TOKENS. The token stops working immediately.`,
  })
  public async revokeApiToken(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const user = actingUserOf(session);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.service.revokeToken(id, {
      userId: user.id,
      canRevokeAll: hasPermission(
        CanRevokeAllApiTokens,
        permissionsOf(session)
      ),
    });
  }
}
