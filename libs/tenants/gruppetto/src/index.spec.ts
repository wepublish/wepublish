import * as entry from './index';

describe('@wepublish/tenant/gruppetto', () => {
  it('loads the package entry without an initialization cycle', () => {
    expect(entry.gruppettoTenant.id).toBe('gruppetto');
    expect(entry.gruppettoTheme).toBeDefined();
    expect(entry.GruppettoSpacer).toBeDefined();
    expect(entry.GruppettoMainSpacer).toBeDefined();
    expect(entry.GruppettoNavBar).toBeDefined();
  });
});
