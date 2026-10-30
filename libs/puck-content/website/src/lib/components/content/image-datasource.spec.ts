import { ComponentConfig } from '@puckeditor/core';

import { BreakConfig } from '../break/break.config';
import { ImageConfig } from './image/image.config';
import { QuoteConfig } from './quote/quote.config';

const configs = { ImageConfig, QuoteConfig, BreakConfig } as Record<
  string,
  ComponentConfig
>;

describe.each(Object.entries(configs))('%s', (_name, config) => {
  it('picks its image through a single image datasource', async () => {
    const fields = await config.resolveFields?.(
      { props: { id: 'a' } } as never,
      { fields: config.fields ?? {} } as never
    );

    expect(fields?.['imageId']).toBeUndefined();
    expect(fields?.['datasources']).toMatchObject({
      type: 'datasource',
      models: ['image'],
      types: ['single'],
    });
  });

  it('hides the resolved image field', () => {
    const image = config.fields?.['image'];

    expect(!image || image.visible === false).toBe(true);
  });

  it('starts with an empty single image datasource', async () => {
    const data = await config.resolveData?.(
      { props: { id: 'a' } } as never,
      {} as never
    );

    expect(data?.props?.['datasources']).toEqual({
      image: { type: 'single', id: '' },
    });
  });
});
