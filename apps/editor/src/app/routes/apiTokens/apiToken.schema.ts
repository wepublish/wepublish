import type {
  CreateApiTokenMutationVariables,
  FullUserRoleFragment,
} from '@wepublish/editor/api';
import type { FormOutput } from '@wepublish/form/editor';
import { AllPermissions } from '@wepublish/permissions';
import { z } from 'zod/v4';

export const MAX_LIFETIME_YEARS = 3;
export const RECOMMENDED_LIFETIME_YEARS = 1;

export const yearsFromNow = (years: number) => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + years);

  return limit;
};

export const endOfDay = (date: Date | null) => {
  if (date === null) {
    return null;
  }

  const day = new Date(date);
  day.setHours(23, 59, 59, 999);

  return day;
};

export const inDays = (days: number) => {
  const day = new Date();
  day.setDate(day.getDate() + days);

  return day;
};

const permissionIds = AllPermissions.map(({ id }) => id);

export const apiTokenSchema = z.object({
  name: z.string().min(1).meta({ label: 'apiTokenList.panels.name' }),
  scopes: z.array(z.enum(permissionIds)).min(1).meta({
    label: 'apiTokenList.panels.scopes',
    helperText: 'apiTokenList.panels.scopesHelp',
  }),
  expiresAt: z
    .date()
    .refine(expiresAt => expiresAt.getTime() > Date.now(), {
      error: 'apiTokenList.panels.expiresInThePast',
    })
    .refine(expiresAt => expiresAt <= yearsFromNow(MAX_LIFETIME_YEARS), {
      error: 'apiTokenList.panels.expiresTooLate',
    })
    .meta({
      label: 'apiTokenList.panels.expiresAt',
      helperText: 'apiTokenList.panels.expiresAtHelp',
    }),
});

export const grantableScopes = (
  sessionRoles: readonly FullUserRoleFragment[] | undefined
) => {
  const held = new Set(
    (sessionRoles ?? []).flatMap(role =>
      role.permissions.map(permission => permission.id)
    )
  );

  return AllPermissions.filter(({ id }) => held.has(id)).map(
    ({ id, description }) => ({ value: id, label: description })
  );
};

export const toCreateApiTokenVariables = ({
  name,
  scopes,
  expiresAt,
}: FormOutput<typeof apiTokenSchema>): CreateApiTokenMutationVariables => ({
  name,
  scopes,
  expiresAt: expiresAt.toISOString(),
});
