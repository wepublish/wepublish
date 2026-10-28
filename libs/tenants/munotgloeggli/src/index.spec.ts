import * as entry from './index';

describe('@wepublish/tenant/munotgloeggli', () => {
  it('loads the package entry without an initialization cycle', () => {
    expect(entry.munotgloeggliTenant.id).toBe('munotgloeggli');
    expect(entry.munotgloeggliTheme).toBeDefined();
  });
});
