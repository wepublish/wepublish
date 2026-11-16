import {
  ArticleListDocument,
  ConsentDocument,
  SettingsListDocument,
} from '@wepublish/editor/api';

import { useQueryLoader } from './use-query-loader';

describe('useQueryLoader', () => {
  it('accepts the variables the query declares', () => {
    expectTypeOf(
      useQueryLoader(
        ConsentDocument,
        { id: 'consent-1' },
        data => data.consent.id
      )
    ).toEqualTypeOf<() => Promise<string>>();
    useQueryLoader(SettingsListDocument, {}, data => data.settings);
    useQueryLoader(
      ArticleListDocument,
      { take: 1, filter: { title: 'Konzert' } },
      data => data.articles
    );
  });

  it('rejects variables the query does not declare', () => {
    useQueryLoader(
      ConsentDocument,
      {
        id: 'consent-1',
        // @ts-expect-error the consent query takes only an id
        bogus: 1,
      },
      data => data.consent
    );
    useQueryLoader(
      ArticleListDocument,
      {
        take: 1,
        // @ts-expect-error filter is misspelt
        filtr: { title: 'Konzert' },
      },
      data => data.articles
    );
  });
});
