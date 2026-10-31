import { FullImageFragment } from '@wepublish/editor/api';
import { SeoContentType } from '@wepublish/ui/editor';

import { seoContentTypes, toSeoPreviewMetadata } from './seo-preview-metadata';

const image = { id: 'image' } as FullImageFragment;
const socialImage = { id: 'social-image' } as FullImageFragment;

describe('toSeoPreviewMetadata', () => {
  it('maps the root metadata onto the editor metadata', () => {
    expect(
      toSeoPreviewMetadata(
        {
          title: 'Page title',
          lead: 'Page lead',
          seoTitle: 'Search title',
          seoDescription: 'Search lead',
          socialMediaTitle: 'Share title',
          socialMediaDescription: 'Share lead',
        },
        { image, socialMediaImage: socialImage },
        'https://wepublish.ch'
      )
    ).toEqual({
      title: 'Page title',
      lead: 'Page lead',
      seoTitle: 'Search title',
      seoDescription: 'Search lead',
      socialMediaTitle: 'Share title',
      socialMediaDescription: 'Share lead',
      image,
      socialMediaImage: socialImage,
      canonicalUrl: undefined,
      url: 'https://wepublish.ch',
    });
  });

  it('keeps the canonical URL of an article', () => {
    expect(
      toSeoPreviewMetadata(
        { title: 'Article', canonicalUrl: 'https://example.com/original' },
        {}
      )
    ).toMatchObject({
      title: 'Article',
      canonicalUrl: 'https://example.com/original',
    });
  });

  it('leaves everything empty without root props', () => {
    expect(toSeoPreviewMetadata(undefined, {})).toEqual({
      title: undefined,
      lead: undefined,
      seoTitle: undefined,
      seoDescription: undefined,
      socialMediaTitle: undefined,
      socialMediaDescription: undefined,
      image: undefined,
      socialMediaImage: undefined,
      canonicalUrl: undefined,
      url: undefined,
    });
  });
});

describe('seoContentTypes', () => {
  it('previews every document kind like its classic editor', () => {
    expect(seoContentTypes).toEqual({
      page: SeoContentType.Page,
      article: SeoContentType.Article,
    });
  });
});
