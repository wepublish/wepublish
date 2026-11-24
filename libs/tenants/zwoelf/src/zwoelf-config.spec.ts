import theme from './theme';
import { zwoelfConfig } from './zwoelf-config';
import { zwoelfTenant } from './zwoelf-tenant';

describe('zwoelfConfig', () => {
  // The TanStack app brings its own router-aware link; `next/link` cannot be
  // bundled outside Next.
  it('binds no link component', () => {
    expect(zwoelfConfig.builder.elements?.Link).toBeUndefined();
  });

  it('is what the Next flavour is built from, apart from the link', () => {
    const { elements, ...builder } = zwoelfTenant.builder;

    expect(elements?.Link).toBeDefined();
    expect({ ...zwoelfTenant, builder }).toEqual({
      ...zwoelfConfig,
      builder: zwoelfConfig.builder,
    });
  });
});

describe('zwoelf theme', () => {
  // Named, not loaded: the app's document requests the stylesheet, because
  // only Next has `next/font`.
  it('sets Hanken Grotesk by name', () => {
    expect(theme.typography.body1.fontFamily).toBe(
      'Hanken Grotesk,sans-serif'
    );
    expect(theme.typography.h1.fontFamily).toBe('Hanken Grotesk,sans-serif');
  });
});
