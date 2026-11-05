import * as entry from './index';

describe('@wepublish/tenant/cultur', () => {
  it('loads the package entry without an initialization cycle', () => {
    expect(entry.culturTenant.id).toBe('cultur');
    expect(entry.culturTheme).toBeDefined();
  });
});
