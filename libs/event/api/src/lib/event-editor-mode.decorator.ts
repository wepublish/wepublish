import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Permission } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';

type EditorRequest = {
  headers?: Record<string, unknown>;
  user?: Parameters<typeof permissionsOf>[0];
};

export const isEventEditorRequest = (
  req: EditorRequest | undefined,
  permission: Permission
) =>
  !!req?.headers?.['preview'] &&
  hasPermission(permission, permissionsOf(req?.user));

export const EventEditorMode = createParamDecorator(
  (permission: Permission, context: ExecutionContext) =>
    isEventEditorRequest(
      GqlExecutionContext.create(context).getContext().req,
      permission
    )
);
