import { ForbiddenException } from '@nestjs/common';
import { GateMode } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import {
  CanCreateBanner,
  CanCreateContentGate,
  CanCreatePaywall,
  CanDeleteBanner,
  CanDeleteContentGate,
  CanDeletePaywall,
  CanGetBanner,
  CanUpdateBanner,
  CanUpdateContentGate,
  CanUpdatePaywall,
  Permission,
} from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';

export type GatePermissionAction = 'get' | 'create' | 'update' | 'delete';

/**
 * Gates share one API, but keep the permissions of the paywall, content gate
 * and banner APIs they replaced, so no role needs migrating.
 * `null` means anyone may: paywalls and content gates were always public.
 */
const GATE_PERMISSIONS: Record<
  GateMode,
  Record<GatePermissionAction, Permission | null>
> = {
  [GateMode.PAYWALL]: {
    get: null,
    create: CanCreatePaywall,
    update: CanUpdatePaywall,
    delete: CanDeletePaywall,
  },
  [GateMode.CONTENT_GATE]: {
    get: null,
    create: CanCreateContentGate,
    update: CanUpdateContentGate,
    delete: CanDeleteContentGate,
  },
  [GateMode.BANNER]: {
    get: CanGetBanner,
    create: CanCreateBanner,
    update: CanUpdateBanner,
    delete: CanDeleteBanner,
  },
};

export function assertGatePermission(
  mode: GateMode,
  action: GatePermissionAction,
  session: AuthSession | null | undefined
) {
  const permission = GATE_PERMISSIONS[mode][action];

  if (!permission) {
    return;
  }

  if (!session || !hasPermission(permission, session.roles)) {
    throw new ForbiddenException(`Missing permission ${permission.id}`);
  }
}
