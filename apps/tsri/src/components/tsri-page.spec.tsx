import { BuilderPageProps } from '@wepublish/website/builder';

import { getPageProperty, isWideLayoutPage } from './tsri-page';

const pageData = (
  properties: Array<{ key: string; value: string }> | undefined
) =>
  ({
    page: {
      latest: {
        properties,
      },
    },
  }) as unknown as BuilderPageProps['data'];

describe('getPageProperty', () => {
  it('returns the property value by trimmed, case-insensitive key', () => {
    expect(
      getPageProperty(
        pageData([{ key: ' PageLayout ', value: 'wide' }]),
        'pagelayout'
      )
    ).toBe('wide');
  });

  it('returns undefined for missing properties or data', () => {
    expect(getPageProperty(pageData([]), 'pagelayout')).toBeUndefined();
    expect(getPageProperty(pageData(undefined), 'pagelayout')).toBeUndefined();
    expect(getPageProperty(undefined, 'pagelayout')).toBeUndefined();
  });
});

describe('isWideLayoutPage', () => {
  it('matches the wide layout values', () => {
    expect(
      isWideLayoutPage(pageData([{ key: 'pageLayout', value: 'wide' }]))
    ).toBe(true);
    expect(
      isWideLayoutPage(
        pageData([{ key: 'pageLayout', value: ' Layout-Wide ' }])
      )
    ).toBe(true);
  });

  it('does not match other values or missing properties', () => {
    expect(
      isWideLayoutPage(pageData([{ key: 'pageLayout', value: 'narrow' }]))
    ).toBe(false);
    expect(isWideLayoutPage(pageData([]))).toBe(false);
    expect(isWideLayoutPage(undefined)).toBe(false);
  });
});
