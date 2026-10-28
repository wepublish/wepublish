import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockAuthorLink,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { ArticleAuthor } from './article-author';

describe('ArticleAuthor', () => {
  it('links the name to the author page and shows the bio and profiles', () => {
    renderWithProviders(
      <ArticleAuthor
        author={mockAuthor({
          name: 'Jane Doe',
          url: 'https://example.com/author/jane-doe',
          bio: mockRichTextParagraph('Writes about cities.'),
          links: [
            mockAuthorLink({ title: 'Website', url: 'https://jane.example' }),
          ],
        })}
      />
    );

    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      'https://example.com/author/jane-doe'
    );
    expect(screen.getByText('Writes about cities.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute(
      'href',
      'https://jane.example'
    );
  });

  it('shows only the name when the author has no image, bio or links', () => {
    const { container } = renderWithProviders(
      <ArticleAuthor
        author={mockAuthor({
          name: 'Jane Doe',
          image: null,
          bio: null,
          links: [],
        })}
      />
    );

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(container.querySelector('img')).toBeNull();
  });
});
