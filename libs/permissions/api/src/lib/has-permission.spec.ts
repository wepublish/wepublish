import { CanGetArticle, CanGetPage } from '@wepublish/permissions';

import { hasPermission, permissionsOf } from './has-permission';

const role = (...permissionIDs: string[]) => ({ id: 'r', permissionIDs });

describe('hasPermission', () => {
  it('accepts roles, as every existing call site passes', () => {
    expect(hasPermission(CanGetArticle, [role(CanGetArticle.id)])).toBe(true);
    expect(hasPermission(CanGetArticle, [role(CanGetPage.id)])).toBe(false);
  });

  it('accepts a bare list of permission ids, as an api token carries', () => {
    expect(hasPermission(CanGetArticle, [CanGetArticle.id])).toBe(true);
    expect(hasPermission(CanGetArticle, [CanGetPage.id])).toBe(false);
  });

  it('requires every permission when given several', () => {
    expect(hasPermission([CanGetArticle, CanGetPage], [CanGetArticle.id])).toBe(
      false
    );

    expect(
      hasPermission(
        [CanGetArticle, CanGetPage],
        [CanGetArticle.id, CanGetPage.id]
      )
    ).toBe(true);
  });

  it('denies when nothing is granted', () => {
    expect(hasPermission(CanGetArticle, [])).toBe(false);
  });
});

describe('permissionsOf', () => {
  it('reads an api token session, which carries permissions directly', () => {
    expect(permissionsOf({ permissions: [CanGetArticle.id] } as never)).toEqual(
      [CanGetArticle.id]
    );
  });

  it('reads a user session, which carries them on its roles', () => {
    expect(
      permissionsOf({ roles: [role(CanGetArticle.id, CanGetPage.id)] } as never)
    ).toEqual([CanGetArticle.id, CanGetPage.id]);
  });

  it('is empty for no session at all', () => {
    expect(permissionsOf(undefined)).toEqual([]);
  });
});
