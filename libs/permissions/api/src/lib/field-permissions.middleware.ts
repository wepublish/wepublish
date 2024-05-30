import {FieldMiddleware} from '@nestjs/graphql'
import {hasPermission} from './has-permission'
import {Permission} from './permissions'

export const FieldMiddlewarePermissions: FieldMiddleware = async (ctx, next) => {
  const {info} = ctx
  const {extensions} = info.parentType.getFields()[info.fieldName]
  const permissions = extensions.permissions as Permission[] | undefined
  const session = ctx.context.req.user

  if (!permissions) {
    return next()
  }
  if (!session) {
    return null
  }

  if (!hasPermission(permissions, session.roles)) {
    return null
  }

  return next()
}
