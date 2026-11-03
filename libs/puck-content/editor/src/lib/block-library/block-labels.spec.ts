import { Config } from '@puckeditor/core';

import { getPuckConfig } from '../config';
import { withTranslatedLabels } from './block-labels';

const t = (key: string, options?: { defaultValue?: string }) =>
  `t(${key}|${options?.defaultValue ?? ''})`;

describe('withTranslatedLabels', () => {
  it('names every block by its translated name, so the action bar, breadcrumb and outline show it', () => {
    const config: Config = {
      components: {
        Title: { nameKey: 'puck.blocks.names.Title', render: () => null },
        FormHidden: {
          nameKey: 'puck.blocks.names.FormHidden',
          label: 'Hidden field',
          render: () => null,
        },
        Hero: { label: 'Hero', render: () => null },
      },
    } as Config;

    const labelled = withTranslatedLabels(config, t);

    expect(labelled.components['Title'].label).toBe(
      't(puck.blocks.names.Title|Title)'
    );
    expect(labelled.components['FormHidden'].label).toBe(
      't(puck.blocks.names.FormHidden|Hidden field)'
    );
    expect(labelled.components['Hero'].label).toBe('Hero');
  });

  it('keeps the components otherwise unchanged', () => {
    const render = () => null;
    const config = {
      components: { Title: { nameKey: 'puck.blocks.names.Title', render } },
      root: { fields: {} },
    } as unknown as Config;

    const labelled = withTranslatedLabels(config, t);

    expect(labelled.components['Title'].render).toBe(render);
    expect(labelled.root).toBe(config.root);
  });

  it('gives every block of the page builder a name to translate', () => {
    const { components } = getPuckConfig('page');
    const unnamed = Object.entries(components)
      .filter(
        ([type, component]) => type !== 'SavedBlocks' && !component.nameKey
      )
      .map(([type]) => type);

    expect(unnamed).toEqual([]);
  });
});
