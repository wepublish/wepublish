import { AuthorSort, SortOrder } from '@wepublish/website/api';

import { bkaMagazinAuthorListVariables } from './bka-magazin-filter';

describe('magazin author filter options', () => {
  it('offers only authors that have published articles, so the panel has no dead options', () => {
    expect(bkaMagazinAuthorListVariables.filter).toEqual({
      hasArticles: true,
    });
  });

  it('lists them alphabetically', () => {
    expect(bkaMagazinAuthorListVariables).toEqual(
      expect.objectContaining({
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
      })
    );
  });
});
