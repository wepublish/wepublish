import type {
  CreateUserRoleMutationVariables,
  FullUserRoleFragment,
} from '@wepublish/editor/api';
import type { FormDefaultValues, FormOutput } from '@wepublish/form/editor';
import { AllPermissions } from '@wepublish/permissions';
import { z } from 'zod/v4';

export const permissionOptions = AllPermissions.map(({ id, description }) => ({
  value: id,
  label: description,
}));

const permissionIds = AllPermissions.map(({ id }) => id);

export const userRoleSchema = z.object({
  name: z.string().min(1).meta({ label: 'userRoles.panels.name' }),
  description: z.string().meta({ label: 'userRoles.panels.description' }),
  permissions: z.array(z.enum(permissionIds)).meta({
    label: 'userRoles.panels.permissions',
    placeholder: 'userRoles.panels.selectPermissions',
  }),
});

export const fromUserRole = ({
  name,
  description,
  permissions,
}: FullUserRoleFragment): FormDefaultValues<typeof userRoleSchema> => ({
  name,
  description: description ?? '',
  permissions: permissions.map(({ id }) => id),
});

export const toUserRoleVariables = ({
  name,
  description,
  permissions,
}: FormOutput<typeof userRoleSchema>): CreateUserRoleMutationVariables => ({
  name,
  description,
  permissionIDs: permissions,
});
