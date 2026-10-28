import { screen } from '@testing-library/react';
import {
  mockAuthor,
  mockAuthorLink,
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullAuthorFragment } from '@wepublish/website/api';
import { Author } from './author';

const renderAuthor = (author: FullAuthorFragment | null) =>
  renderWithProviders(
    <Author
      data={author ? { __typename: 'Query', author } : undefined}
      loading={false}
      error={undefined}
    />
  );

describe('Author', () => {
  it('shows the name as page heading, the job title and the bio', () => {
    renderAuthor(
      mockAuthor({
        name: 'Jane Doe',
        jobTitle: 'Editor in chief',
        bio: mockRichTextParagraph('Writes about cities.'),
      })
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Jane Doe' })
    ).toBeInTheDocument();
    expect(screen.getByText('Editor in chief')).toBeInTheDocument();
    expect(screen.getByText('Writes about cities.')).toBeInTheDocument();
  });

  it('links to every profile of the author', () => {
    renderAuthor(
      mockAuthor({
        links: [
          mockAuthorLink({ title: 'Mastodon', url: 'https://mastodon.social' }),
          mockAuthorLink({ title: 'Website', url: 'https://jane.example' }),
        ],
      })
    );

    expect(screen.getByRole('link', { name: 'Mastodon' })).toHaveAttribute(
      'href',
      'https://mastodon.social'
    );
    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute(
      'href',
      'https://jane.example'
    );
  });

  it('leaves out the job title, image and links when the author has none', () => {
    const { container } = renderAuthor(
      mockAuthor({
        jobTitle: null,
        image: null,
        links: [],
        bio: mockRichTextParagraph('Writes about cities.'),
      })
    );

    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the portrait when the author has one', () => {
    renderAuthor(
      mockAuthor({ image: mockImage({ description: 'Portrait of Jane Doe' }) })
    );

    expect(
      screen.getByRole('img', { name: 'Portrait of Jane Doe' })
    ).toBeInTheDocument();
  });

  it('renders nothing without an author', () => {
    const { container } = renderAuthor(null);

    expect(container).toBeEmptyDOMElement();
  });
});
