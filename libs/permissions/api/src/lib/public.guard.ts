import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {GqlExecutionContext} from '@nestjs/graphql'
import {PUBLIC_METADATA_KEY} from './public.decorator'

@Injectable()
export class PublicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context)

    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    return isPublic
  }
}
