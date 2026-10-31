import { LayoutBlockProps } from '@wepublish/puck-content/website';

import { PuckConfig } from '../../config.types';
import { layoutComponents } from './layout.blocks';

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

  it('configures every layout block of the website', () => {
    expectTypeOf<keyof typeof layoutComponents>().toEqualTypeOf<
      keyof LayoutBlockProps
    >();
    expectTypeOf(layoutComponents).toExtend<
      Pick<PuckConfig['components'], keyof LayoutBlockProps>
    >();
  });
});
