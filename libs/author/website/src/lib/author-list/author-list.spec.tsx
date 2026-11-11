import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockImage,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullAuthorFragment } from '@wepublish/website/api';
import { AuthorList } from './author-list';

const renderList = (authors: FullAuthorFragment[] | null) =>
  renderWithProviders(
    <AuthorList
      data={
        authors ?
          {
            __typename: 'Query',
            authors: mockPaginated('PaginatedAuthors', authors),
          }
        : undefined
      }
      loading={!authors}
      error={undefined}
      variables={{}}
    />
  );

describe('AuthorList', () => {
  it('lists every author in order, each linking to their page', () => {
    renderList([
      mockAuthor({ name: 'Jane Doe', url: 'https://example.com/jane' }),
      mockAuthor({ name: 'John Roe', url: 'https://example.com/john' }),
      mockAuthor({ name: 'Max Muster', url: 'https://example.com/max' }),
    ]);

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Jane Doe', 'John Roe', 'Max Muster']);
    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href'))
    ).toEqual([
      'https://example.com/jane',
      'https://example.com/john',
      'https://example.com/max',
    ]);
  });

  it('shows job titles and images only for authors that have them', () => {
    renderList([
      mockAuthor({
        jobTitle: 'Editor',
        image: mockImage({ description: 'Portrait' }),
      }),
      mockAuthor({ jobTitle: null, image: null }),
      mockAuthor({ jobTitle: 'Editor', image: null }),
    ]);

    expect(screen.getAllByText('Editor')).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Portrait' })).toHaveLength(1);
    expect(document.querySelectorAll('img')).toHaveLength(1);
  });

  it('lists nobody while the authors are loading', () => {
    renderList(null);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
