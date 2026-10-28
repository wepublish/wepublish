import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { AuthorDocument, AuthorQueryVariables } from '@wepublish/website/api';
import { AuthorContainer } from './author-container';

const author = mockAuthor({ slug: 'jane-doe', name: 'Jane Doe' });

const authorQuery = (variables: AuthorQueryVariables) =>
  mockOperation(AuthorDocument, {
    variables,
    data: { __typename: 'Query', author },
  });

describe('AuthorContainer', () => {
  it('loads the author by id', async () => {
    renderWithProviders(<AuthorContainer id={author.id} />, {
      mocks: [authorQuery({ id: author.id })],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })
    ).toBeInTheDocument();
  });

  it('loads the author by slug', async () => {
    renderWithProviders(<AuthorContainer slug="jane-doe" />, {
      mocks: [authorQuery({ slug: 'jane-doe' })],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })
    ).toBeInTheDocument();
  });
});
