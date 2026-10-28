import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { AuthorChip } from './author-chip';

describe('AuthorChip', () => {
  it('credits the author with a link to their page and their job title', () => {
    renderWithProviders(
      <AuthorChip
        author={mockAuthor({
          name: 'Jane Doe',
          jobTitle: 'Editor in chief',
          url: 'https://example.com/author/jane-doe',
          image: mockImage({ description: 'Portrait of Jane Doe' }),
        })}
      />
    );

    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      'https://example.com/author/jane-doe'
    );
    expect(screen.getByText('Editor in chief')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Portrait of Jane Doe' })
    ).toBeInTheDocument();
  });

  it('adds the role the author had on the article', () => {
    renderWithProviders(
      <AuthorChip
        author={mockAuthor({ name: 'Jane Doe' })}
        role="Fotos"
      />
    );

    expect(screen.getByText('(Fotos)')).toBeInTheDocument();
  });

  it('leaves out job title and image when the author has none', () => {
    const { container } = renderWithProviders(
      <AuthorChip author={mockAuthor({ jobTitle: null, image: null })} />
    );

    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
