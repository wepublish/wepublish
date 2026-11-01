import { LayoutBlockProps } from '@wepublish/puck-content/website';

import { PuckConfig } from '../../config.types';
import {
  groupFieldTabs,
  layoutItemsFieldTabs,
} from '../../field-tabs/field-tabs';
import { layoutComponents, layoutFieldTabs } from './layout.blocks';

describe('layoutComponents', () => {
  it.each(['Grid', 'DynamicGrid', 'Row', 'Slider', 'Container'] as const)(
    '%s provides or consumes articles, pages and events',
    type => {
      expect(layoutComponents[type].fields?.datasources).toMatchObject({
        type: 'datasource',
        models: ['article', 'page', 'event'],
        types: ['uniqueList', 'list', 'multiple', 'single', 'slot'],
      });
    }
  );

  it.each(['Space', 'Collapsible'] as const)('%s has no datasources', type => {
    expect(layoutComponents[type].fields).not.toHaveProperty('datasources');
  });

  it('shows the DynamicGrid items in the layout tab', () => {
    expect(layoutFieldTabs).toEqual({ DynamicGrid: layoutItemsFieldTabs });
  });

  it('puts the DynamicGrid items above its layout', () => {
    expect(
      groupFieldTabs(
        Object.keys(layoutComponents.DynamicGrid.fields ?? {}),
        layoutItemsFieldTabs
      )[0]
    ).toEqual({ value: 'layout', fields: ['items', 'layout'] });
  });

  it('configures every layout block of the website', () => {
    expectTypeOf<keyof typeof layoutComponents>().toEqualTypeOf<
      keyof LayoutBlockProps
    >();
    expectTypeOf(layoutComponents).toExtend<
      Pick<PuckConfig['components'], keyof LayoutBlockProps>
    >();
  });
});
