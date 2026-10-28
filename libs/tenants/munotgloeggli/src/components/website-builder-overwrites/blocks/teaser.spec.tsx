import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleTeaser,
  mockFlexAlignment,
  mockPage,
  mockPageRevision,
  mockPageTeaser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullTeaserFragment } from '@wepublish/website/api';

import { munotgloeggliTenant } from '../../../munotgloeggli-tenant';
import { MunotgloeggliBaseTeaser } from './teaser';

const publishedAt = '2024-03-15T12:00:00.000Z';
const formattedDate = munotgloeggliTenant.builder.date?.format?.(
  new Date(publishedAt),
  false
);

const renderTeaser = (teaser: FullTeaserFragment) =>
  renderWithProviders(
    <MunotgloeggliBaseTeaser
      teaser={teaser}
      alignment={mockFlexAlignment()}
      index={0}
      blockStyle={null}
    />,
    { tenant: munotgloeggliTenant }
  );

describe('MunotgloeggliBaseTeaser', () => {
  it('does not show when a page was published', () => {
    renderTeaser(
      mockPageTeaser({
        title: 'Über das Munotglöggli',
        page: mockPage({
          publishedAt,
          latest: mockPageRevision({ publishedAt, blocks: [] }),
        }),
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Über das Munotglöggli' })
    ).toBeInTheDocument();
    expect(screen.queryByText(formattedDate ?? '')).not.toBeInTheDocument();
  });

  it('shows when an article was published', () => {
    renderTeaser(
      mockArticleTeaser({
        title: 'Neues aus der Munotstadt',
        article: mockArticle({
          publishedAt,
          latest: mockArticleRevision({ publishedAt, blocks: [] }),
        }),
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Neues aus der Munotstadt' })
    ).toBeInTheDocument();
    expect(screen.getByText(formattedDate ?? '')).toBeInTheDocument();
  });
});
