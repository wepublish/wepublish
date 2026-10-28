import * as entry from './index';

describe('@wepublish/tenant/zwoelf', () => {
  it('loads the package entry without an initialization cycle', () => {
    expect(entry.zwoelfTenant.id).toBe('zwoelf');
    expect(entry.zwoelfTheme).toBeDefined();
  });
});
