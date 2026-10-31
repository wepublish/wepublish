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
    const fields =
      config.resolveFields ?
        await config.resolveFields(
          { props: { id: 'a' } } as never,
          { fields: config.fields ?? {} } as never
        )
      : config.fields;

    expect(fields?.['imageId']).toBeUndefined();
    expect(config.fields?.['datasources']).toMatchObject({
      type: 'datasource',
      models: ['image'],
      types: ['single'],
      label: 'Image',
    });
    expect(fields?.['datasources']).toEqual(config.fields?.['datasources']);
  });

  it('hides the resolved image field', () => {
    const image = config.fields?.['image'];

    expect(!image || image.visible === false).toBe(true);
  });

  it('starts with an empty single image datasource', () => {
    expect(config.defaultProps?.['datasources']).toEqual({
      image: { type: 'single', id: '' },
    });
  });

  it('never resets the picked image while resolving', async () => {
    const datasources = { image: { type: 'single', id: 'image-1' } };
    const resolved = await config.resolveData?.(
      { props: { id: 'a', datasources } } as never,
      {} as never
    );

    expect(resolved?.props?.['datasources'] ?? datasources).toEqual(
      datasources
    );
  });
});
