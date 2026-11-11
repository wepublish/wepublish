import * as lib from './index';

describe('@wepublish/tenant/factuel', () => {
  it('can be imported through its entry point', () => {
    expect(lib.courantConfig.id).toBe('factuel');
    expect(lib.CourantNavbar).toBeDefined();
    expect(lib.CourantFooter).toBeDefined();
    expect(lib.CourantContentWrapper).toBeDefined();
    expect(lib.courantTheme).toBeDefined();
  });
});
