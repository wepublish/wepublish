import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { AuthorListItem } from './author-list-item';

describe('AuthorListItem', () => {
  it('links the whole entry to the author page', () => {
    renderWithProviders(
      <AuthorListItem
        {...mockAuthor({
          name: 'Jane Doe',
          jobTitle: 'Editor in chief',
          url: 'https://example.com/author/jane-doe',
          image: mockImage({ description: 'Portrait of Jane Doe' }),
        })}
      />
    );

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://example.com/author/jane-doe');
    expect(link).toHaveTextContent('Jane Doe');
    expect(link).toHaveTextContent('Editor in chief');
    expect(
      screen.getByRole('img', { name: 'Portrait of Jane Doe' })
    ).toBeInTheDocument();
  });

  it('leaves out job title and image when the author has none', () => {
    const { container } = renderWithProviders(
      <AuthorListItem {...mockAuthor({ jobTitle: null, image: null })} />
    );

    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
