import { mockTag, renderWithProviders } from '@wepublish/mocks/website';

import { TagSEO } from './tag-seo';

const documentTitle = () => document.querySelector('title')?.textContent;

describe('TagSEO', () => {
  it('titles the page "<tag> — <site>" by default', () => {
    renderWithProviders(<TagSEO tag={mockTag({ tag: 'solar' })} />, {
      builder: { meta: { siteTitle: 'Site' } },
    });

    expect(documentTitle()).toBe('solar — Site');
  });

  it('uses the title a tenant passes in', () => {
    renderWithProviders(
      <TagSEO
        tag={mockTag({ tag: 'solar' })}
        title="Site - Thema «Solar»"
      />,
      { builder: { meta: { siteTitle: 'Site' } } }
    );

    expect(documentTitle()).toBe('Site - Thema «Solar»');
  });
});
