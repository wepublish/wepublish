import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleTeaser,
  mockFlexAlignment,
  renderWithProviders,
} from '@wepublish/mocks/website';

import { zwoelfTenant } from '../zwoelf-tenant';
import { ZwoelfBaseTeaser } from './zwoelf-base-teaser';

const publishedAt = '2024-03-15T12:00:00.000Z';

describe('ZwoelfBaseTeaser', () => {
  it('hides when the article was published', () => {
    renderWithProviders(
      <ZwoelfBaseTeaser
        teaser={mockArticleTeaser({
          title: 'Das Magazin für Fussballkultur',
          article: mockArticle({
            publishedAt,
            latest: mockArticleRevision({ publishedAt, blocks: [] }),
          }),
        })}
        alignment={mockFlexAlignment()}
        index={0}
        blockStyle={null}
      />,
      { tenant: zwoelfTenant }
    );

    const date = screen.getByText(
      zwoelfTenant.builder.date?.format?.(new Date(publishedAt), false) ?? ''
    );

    expect(
      screen.getByRole('heading', { name: 'Das Magazin für Fussballkultur' })
    ).toBeVisible();
    expect(date).not.toBeVisible();
  });
});
