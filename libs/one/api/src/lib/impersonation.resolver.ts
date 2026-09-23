import { ForbiddenException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ImpersonationError,
  SessionService,
  isImpersonationEnabled,
} from '@wepublish/session/api';
import {
  ImpersonationGrantResult,
  ImpersonationSessionInfo,
  ImpersonationUser,
} from './impersonation.model';
import { ImpersonationSearchService } from './impersonation.service';
import { OneScopedJwt } from './one-scoped-jwt.decorator';

@Resolver()
export class ImpersonationResolver {
  constructor(
    private sessionService: SessionService,
    private searchService: ImpersonationSearchService
  ) {}

  private assertEnabled(): void {
    if (!isImpersonationEnabled(process.env)) {
      throw new ForbiddenException('Impersonation is disabled for this medium');
    }
  }

  @OneScopedJwt('write:impersonate')
  @Query(() => Boolean, { name: 'impersonationEnabled' })
  async getImpersonationEnabled(): Promise<boolean> {
    return isImpersonationEnabled(process.env);
  }

  @OneScopedJwt('write:impersonate')
  @Query(() => [ImpersonationUser], { name: 'impersonationSearchUsers' })
  async searchUsers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<ImpersonationUser[]> {
    this.assertEnabled();

    return this.searchService.searchUsers(query, limit);
  }

  @OneScopedJwt('write:impersonate')
  @Query(() => [ImpersonationSessionInfo], { name: 'impersonationSessions' })
  async impersonationSessions(): Promise<ImpersonationSessionInfo[]> {
    this.assertEnabled();

    const sessions = await this.sessionService.listImpersonationSessions();

    return sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      impersonatedBy: session.impersonatedBy,
      impersonationReason: session.impersonationReason,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
    }));
  }

  @OneScopedJwt('write:impersonate')
  @Mutation(() => ImpersonationGrantResult, {
    name: 'createImpersonationGrant',
  })
  async createImpersonationGrant(
    @Args('userId') userId: string,
    @Args('durationMinutes', { type: () => Int }) durationMinutes: number,
    @Args('reason') reason: string,
    @Args('impersonatedBy') impersonatedBy: string
  ): Promise<ImpersonationGrantResult> {
    this.assertEnabled();

    try {
      return await this.sessionService.createImpersonationGrant({
        userId,
        durationMinutes,
        reason,
        impersonatedBy,
      });
    } catch (error) {
      if (error instanceof ImpersonationError) {
        throw new ForbiddenException(error.message);
      }

      throw error;
    }
  }

  @OneScopedJwt('write:impersonate')
  @Mutation(() => Int, { name: 'revokeImpersonationSessions' })
  async revokeImpersonationSessions(
    @Args('ids', { type: () => [String], nullable: true }) ids?: string[]
  ): Promise<number> {
    this.assertEnabled();

    return this.sessionService.revokeImpersonationSessions(ids);
  }
}
