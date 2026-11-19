import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockAuthorsBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';

import { AuthorsBlock, isAuthorsBlock } from './authors-block';

describe('AuthorsBlock', () => {
  it('shows the title above the authors', () => {
    renderWithProviders(
      <AuthorsBlock {...mockAuthorsBlock({ title: 'Team' })} />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Team' })
    ).toBeInTheDocument();
  });

  it('shows every chosen author in the chosen order, linked to their page', () => {
    renderWithProviders(
      <AuthorsBlock
        {...mockAuthorsBlock({
          authors: [
            mockAuthor({ name: 'Ramona Sprenger', url: '/author/ramona' }),
            mockAuthor({ name: 'Karl Merkli', url: '/author/karl' }),
          ],
        })}
      />
    );

    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href'))
    ).toEqual(['/author/ramona', '/author/karl']);
    expect(screen.getByText('Ramona Sprenger')).toBeInTheDocument();
    expect(screen.getByText('Karl Merkli')).toBeInTheDocument();
  });

  it('leaves out the title when there is none', () => {
    renderWithProviders(
      <AuthorsBlock {...mockAuthorsBlock({ title: null })} />
    );

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('recognises an authors block', () => {
    expect(isAuthorsBlock(mockAuthorsBlock())).toBe(true);
    expect(isAuthorsBlock({ __typename: 'EventBlock' })).toBe(false);
  });
});
