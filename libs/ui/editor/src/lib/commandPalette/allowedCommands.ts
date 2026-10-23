import type { Command } from './command';

export function allowedCommands(
  commands: Command[],
  grantedPermissions: ReadonlySet<string> | undefined,
  enabledFeatures: ReadonlySet<string> | undefined
): Command[] {
  const grantsOneOf = (permissions: string[] | undefined) =>
    !permissions?.length ||
    !grantedPermissions ||
    permissions.some(permission => grantedPermissions.has(permission));

  return commands.filter(({ permissions, alsoPermissions, feature }) => {
    if (feature && !enabledFeatures?.has(feature)) {
      return false;
    }

    return grantsOneOf(permissions) && grantsOneOf(alsoPermissions);
  });
}
