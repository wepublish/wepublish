import { screen } from '@testing-library/react';
import { mockAuthorLink, renderWithProviders } from '@wepublish/mocks/website';
import { AuthorLinks } from './author-links';

describe('AuthorLinks', () => {
  it('renders one link per entry, named by its title, opening in a new tab', () => {
    const links = [
      mockAuthorLink({ title: 'Twitter', url: 'https://twitter.com/jane' }),
      mockAuthorLink({ title: 'Mail', url: 'mailto:redaktion@example.com' }),
      mockAuthorLink({ title: 'Presseausweis', url: 'https://example.com' }),
    ];

    renderWithProviders(<AuthorLinks links={links} />);

    const rendered = screen.getAllByRole('link');

    expect(rendered.map(link => link.getAttribute('href'))).toEqual([
      'https://twitter.com/jane',
      'mailto:redaktion@example.com',
      'https://example.com',
    ]);
    expect(rendered.map(link => link.getAttribute('title'))).toEqual([
      'Twitter',
      'Mail',
      'Presseausweis',
    ]);
    expect(rendered[0]).toHaveAttribute('target', '__blank');
  });
});
