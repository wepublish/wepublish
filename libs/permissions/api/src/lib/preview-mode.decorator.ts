import {createParamDecorator, ExecutionContext} from '@nestjs/common'
import {GqlExecutionContext} from '@nestjs/graphql'

export const PreviewMode = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context)
  return 'preview' in ctx.getContext().req.headers
})
