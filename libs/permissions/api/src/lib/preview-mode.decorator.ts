import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { hasPermission } from './has-permission';
import { CanPreview } from '@wepublish/permissions';

export const PreviewMode = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    const canPreview = hasPermission(CanPreview, user?.roles ?? []);

    return canPreview && !!ctx.getContext().req.headers.preview;
  }
);
