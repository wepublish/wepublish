import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export const ONE_SCOPED_JWT_METADATA_KEY = 'one_scoped_jwt';
export const ONE_SCOPED_JWT_VERIFIER = Symbol('ONE_SCOPED_JWT_VERIFIER');

export interface OneScopedJwtVerifier {
  verifyScopedJWT(token: string, expectedScope: string): Promise<boolean>;
}

@Injectable()
export class OneScopedJwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(ONE_SCOPED_JWT_VERIFIER) private verifier: OneScopedJwtVerifier
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<string>(
      ONE_SCOPED_JWT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredScope) {
      return false;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const authHeader = request?.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    return this.verifier.verifyScopedJWT(authHeader.slice(7), requiredScope);
  }
}
