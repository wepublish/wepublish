import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockOperation,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { AuthorListDocument } from '@wepublish/website/api';
import { AuthorListContainer } from './author-list-container';

describe('AuthorListContainer', () => {
  it('loads the authors with the given variables and lists them', async () => {
    renderWithProviders(<AuthorListContainer variables={{ take: 2 }} />, {
      mocks: [
        mockOperation(AuthorListDocument, {
          variables: { take: 2 },
          data: {
            __typename: 'Query',
            authors: mockPaginated('PaginatedAuthors', [
              mockAuthor({ name: 'Jane Doe' }),
              mockAuthor({ name: 'John Roe' }),
            ]),
          },
        }),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: 'Jane Doe' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'John Roe' })
    ).toBeInTheDocument();
  });
});
