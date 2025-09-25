import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { isObservable, lastValueFrom } from 'rxjs';
import { ONE_OF_METADATA_KEY } from './one-of.decorator';

@Injectable()
export class OneOfGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedGuards = this.reflector.getAllAndMerge<Type<CanActivate>[]>(
      ONE_OF_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    const guards = allowedGuards.map(guardReference =>
      this.moduleRef.get<CanActivate>(guardReference, { strict: false })
    );

    if (!guards.length) {
      return false;
    }

    const checks = await Promise.all(
      guards.map(async guard => {
        try {
          const canActivate$ = guard.canActivate(context);
          const canActivate =
            isObservable(canActivate$) ?
              await lastValueFrom(canActivate$)
            : await canActivate$;

          return canActivate;
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            return false;
          }

          throw error;
        }
      })
    );

    return checks.some(Boolean);
  }
}
