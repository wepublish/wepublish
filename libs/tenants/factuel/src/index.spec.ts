import * as lib from './index';

describe('@wepublish/tenant/factuel', () => {
  it('can be imported through its entry point', () => {
    expect(lib.factuelTenant.id).toBe('factuel');
    expect(lib.FactuelNavbar).toBeDefined();
    expect(lib.FactuelFooter).toBeDefined();
    expect(lib.FactuelContentWrapper).toBeDefined();
    expect(lib.factuelTheme).toBeDefined();
  });
});
