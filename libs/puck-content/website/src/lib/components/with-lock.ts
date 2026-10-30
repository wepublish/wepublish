import { ComponentConfig } from '@puckeditor/core';

import { lockPermissions } from '@wepublish/puck-content/editor';

export function withLock<Config extends ComponentConfig<any>>(
  config: Config
): Config {
  const baseResolvePermissions = config.resolvePermissions;

  return {
    ...config,
    resolvePermissions: async (data, params) =>
      lockPermissions(
        data,
        baseResolvePermissions ?
          await baseResolvePermissions(data, params)
        : params.permissions
      ),
  };
}

export const withLockAll = <
  Components extends Record<string, ComponentConfig<any>>,
>(
  components: Components
): Components =>
  Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      withLock(component),
    ])
  ) as Components;
