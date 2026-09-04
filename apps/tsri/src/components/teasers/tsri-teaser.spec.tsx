import { FullTeaserFragment } from '@wepublish/website/api';

import { selectTeaserAuthors } from './tsri-teaser';

const articleTeaser = (hideAuthor: boolean) =>
  ({
    __typename: 'ArticleTeaser',
    article: {
      latest: {
        hideAuthor,
        authors: [
          { name: 'Visible Author', hideOnTeaser: false },
          { name: 'Hidden Author', hideOnTeaser: true },
        ],
      },
    },
  }) as unknown as FullTeaserFragment;

describe('selectTeaserAuthors', () => {
  it('returns authors that are not hidden on teasers', () => {
    expect(selectTeaserAuthors(articleTeaser(false))).toEqual([
      { name: 'Visible Author', hideOnTeaser: false },
    ]);
  });

  it('returns no authors when the article hides its authors', () => {
    expect(selectTeaserAuthors(articleTeaser(true))).toBeNull();
  });
});
