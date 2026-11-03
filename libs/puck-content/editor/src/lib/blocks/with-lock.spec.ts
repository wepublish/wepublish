import { ComponentConfig } from '@puckeditor/core';
import { createElement, Fragment } from 'react';

import { withLock } from './with-lock';

const render = () => createElement(Fragment);

const resolve = (config: ComponentConfig, locked: boolean) =>
  config.resolvePermissions?.(
    { props: { id: 'a', locked } },
    {
      changed: {},
      lastPermissions: {},
      permissions: { drag: true, delete: true, edit: true, insert: true },
      appState: {} as never,
      lastData: null,
      parent: null,
    }
  );

describe('withLock', () => {
  it('locks a block on top of its own permissions', async () => {
    const config = withLock<ComponentConfig>({
      render,
      resolvePermissions: () => ({ duplicate: false }),
    });

    expect(await resolve(config, true)).toEqual({
      duplicate: false,
      drag: false,
      delete: false,
      edit: false,
      insert: true,
    });
    expect(await resolve(config, false)).toEqual({ duplicate: false });
  });

  it('falls back to the default permissions without its own resolver', async () => {
    const config = withLock<ComponentConfig>({ render });

    expect(await resolve(config, false)).toEqual({
      drag: true,
      delete: true,
      edit: true,
      insert: true,
    });
  });
});
