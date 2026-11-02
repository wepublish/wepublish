import { ComponentConfig, Data } from '@puckeditor/core';
import { createElement, Fragment } from 'react';

import { withGroup } from './with-group';

const render = () => createElement(Fragment);

const data: Data = {
  root: { props: {} },
  content: [
    {
      type: 'Container',
      props: {
        id: 'A',
        grouped: true,
        content: [{ type: 'Title', props: { id: 'C' } }],
      },
    },
  ],
};

const resolve = (config: ComponentConfig, id: string) =>
  config.resolvePermissions?.(
    { props: { id } },
    {
      changed: {},
      lastPermissions: {},
      permissions: { drag: true, delete: true, edit: true, insert: true },
      appState: { data, ui: {} } as never,
      lastData: null,
      parent: null,
    }
  );

describe('withGroup', () => {
  it('keeps the blocks inside a group in place on top of their own permissions', async () => {
    const config = withGroup<ComponentConfig>({
      render,
      resolvePermissions: () => ({ edit: false }),
    });

    expect(await resolve(config, 'C')).toEqual({
      edit: false,
      drag: false,
      delete: false,
      duplicate: false,
    });
    expect(await resolve(config, 'A')).toEqual({ edit: false });
  });

  it('falls back to the default permissions without its own resolver', async () => {
    const config = withGroup<ComponentConfig>({ render });

    expect(await resolve(config, 'A')).toEqual({
      drag: true,
      delete: true,
      edit: true,
      insert: true,
    });
  });
});
