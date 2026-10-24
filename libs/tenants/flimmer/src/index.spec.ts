import * as entry from './index';

describe('@wepublish/tenant/flimmer', () => {
  it('loads the package entry without an initialization cycle', () => {
    expect(entry.flimmerTenant.id).toBe('flimmer');
    expect(entry.flimmerTheme).toBeDefined();
  });
});
