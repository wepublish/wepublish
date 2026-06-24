import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export const SCOPED_JWT_METADATA_KEY = 'scoped_jwt';

export interface ScopedJwtVerifier {
  verifyScopedJWT(token: string, expectedScope: string): Promise<boolean>;
}

export const SCOPED_JWT_VERIFIER = Symbol('SCOPED_JWT_VERIFIER');

@Injectable()
export class ScopedJwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(SCOPED_JWT_VERIFIER) private verifier: ScopedJwtVerifier
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<string>(
      SCOPED_JWT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredScope) {
      return false;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);

    return this.verifier.verifyScopedJWT(token, requiredScope);
  }
}
