import { resolveRootSEO } from './root-seo';

describe('resolveRootSEO', () => {
  it('prefers the dedicated SEO and social media texts', () => {
    expect(
      resolveRootSEO({
        title: 'Title',
        lead: 'Lead',
        seoTitle: 'Search title',
        seoDescription: 'Search lead',
        socialMediaTitle: 'Share title',
        socialMediaDescription: 'Share lead',
      })
    ).toEqual({
      title: 'Search title',
      description: 'Search lead',
      socialMediaTitle: 'Share title',
      socialMediaDescription: 'Share lead',
    });
  });

  it('falls back to the general title and lead', () => {
    expect(resolveRootSEO({ title: 'Title', lead: 'Lead' })).toEqual({
      title: 'Title',
      description: 'Lead',
      socialMediaTitle: 'Title',
      socialMediaDescription: 'Lead',
    });
  });

  it('shares the SEO texts with social media when those are empty', () => {
    expect(
      resolveRootSEO({
        seoTitle: 'Search title',
        seoDescription: 'Search lead',
      })
    ).toEqual({
      title: 'Search title',
      description: 'Search lead',
      socialMediaTitle: 'Search title',
      socialMediaDescription: 'Search lead',
    });
  });
});
