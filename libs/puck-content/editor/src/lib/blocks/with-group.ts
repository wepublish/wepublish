import { ComponentConfig } from '@puckeditor/core';

import { groupPermissions } from '../group/group';

export function withGroup<Config extends ComponentConfig<any>>(
  config: Config
): Config {
  const baseResolvePermissions = config.resolvePermissions;

  return {
    ...config,
    resolvePermissions: async (data, params) =>
      groupPermissions(
        data,
        params.appState?.data,
        baseResolvePermissions ?
          await baseResolvePermissions(data, params)
        : params.permissions
      ),
  };
}

export const withGroupAll = <
  Components extends Record<string, ComponentConfig<any>>,
>(
  components: Components
): Components =>
  Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      withGroup(component),
    ])
  ) as Components;
