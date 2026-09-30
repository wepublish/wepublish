import {
  FullImageFragment,
  SeoMetadataContentType,
} from '@wepublish/editor/api';

import { getDomain, getSeoPreviewData } from './seoPreviewData';

const image = (id: string) => ({ id }) as unknown as FullImageFragment;

describe('getSeoPreviewData', () => {
  describe('articles', () => {
    test('prefers the SEO and social media fields like the website', () => {
      expect(
        getSeoPreviewData(
          SeoMetadataContentType.Article,
          {
            title: 'Title',
            lead: 'Lead',
            seoTitle: 'SEO title',
            seoDescription: 'SEO description',
            socialMediaTitle: 'Social title',
            socialMediaDescription: 'Social description',
            url: 'https://www.example.com/a/slug',
            image: image('image'),
            socialMediaImage: image('social'),
          },
          {},
          'Example News'
        )
      ).toEqual({
        title: 'SEO title',
        documentTitle: 'SEO title — Example News',
        description: 'SEO description',
        socialTitle: 'Social title',
        socialDescription: 'Social description',
        image: image('social'),
        url: 'https://www.example.com/a/slug',
        domain: 'example.com',
        ignoredFields: [],
      });
    });

    test('falls back to title, lead and block content', () => {
      const data = getSeoPreviewData(
        SeoMetadataContentType.Article,
        { title: ' ', lead: '', seoTitle: '', url: 'https://example.com/a/x' },
        {
          firstTitle: 'Block title',
          firstParagraph: 'First paragraph',
          firstImage: image('block'),
        }
      );

      expect(data).toMatchObject({
        title: 'Block title',
        documentTitle: 'Block title',
        description: 'First paragraph',
        socialTitle: 'Block title',
        socialDescription: 'First paragraph',
        image: image('block'),
      });
    });

    test('uses the canonical url when set', () => {
      expect(
        getSeoPreviewData(
          SeoMetadataContentType.Article,
          {
            url: 'https://example.com/a/x',
            canonicalUrl: 'https://original.org/story',
          },
          {}
        )
      ).toMatchObject({
        url: 'https://original.org/story',
        domain: 'original.org',
      });
    });
  });

  describe('pages', () => {
    test('ignores the SEO fields like the website and reports it', () => {
      expect(
        getSeoPreviewData(
          SeoMetadataContentType.Page,
          {
            title: 'Page title',
            lead: 'Page description',
            seoTitle: 'SEO title',
            seoDescription: 'SEO description',
            url: 'https://example.com/about',
          },
          {}
        )
      ).toMatchObject({
        title: 'Page title',
        description: 'Page description',
        socialTitle: 'Page title',
        ignoredFields: ['seoTitle', 'seoDescription'],
      });
    });

    test('uses the social media description as description', () => {
      expect(
        getSeoPreviewData(
          SeoMetadataContentType.Page,
          { lead: 'Page description', socialMediaDescription: 'Social' },
          {}
        )
      ).toMatchObject({
        description: 'Social',
        socialDescription: 'Social',
        ignoredFields: [],
      });
    });
  });
});

describe('getDomain', () => {
  test.each([
    ['https://www.example.com/a/x', 'example.com'],
    ['http://localhost:3000/a/x', 'localhost:3000'],
    ['not a url', undefined],
    [undefined, undefined],
  ])('%s → %s', (url, domain) => {
    expect(getDomain(url)).toBe(domain);
  });
});
