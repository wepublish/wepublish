import type { Command } from './command';

export function allowedCommands(
  commands: Command[],
  grantedPermissions: ReadonlySet<string> | undefined,
  enabledFeatures: ReadonlySet<string> | undefined
): Command[] {
  return commands.filter(({ permissions, feature }) => {
    if (feature && !enabledFeatures?.has(feature)) {
      return false;
    }

    if (!permissions?.length || !grantedPermissions) {
      return true;
    }

    return permissions.some(permission => grantedPermissions.has(permission));
  });
}
