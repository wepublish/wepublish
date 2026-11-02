import {
  ArticleTemplateMetadataFragment,
  FullArticleFragment,
  FullAuthorFragment,
  FullImageFragment,
} from '@wepublish/editor/api';
import { ArticleMetadata } from '@wepublish/ui/editor';

import { emptyArticleMetadata } from './articleDefaults';
import {
  articleMetadataToMetadataInput,
  articleTemplateMetadataToArticleMetadata,
  articleToArticleMetadata,
} from './articleMapping';

const author = {
  __typename: 'Author',
  id: 'author-1',
  name: 'Author',
} as FullAuthorFragment;
const tag = { __typename: 'Tag', id: 'tag-1', tag: 'Tag' } as const;
const image = { __typename: 'Image', id: 'image-1' } as FullImageFragment;

const article = {
  __typename: 'Article',
  id: 'article-1',
  slug: 'slug',
  url: 'https://example.com/a/slug',
  shared: true,
  hidden: false,
  disableComments: true,
  likes: 3,
  paywallId: 'paywall-1',
  tags: [tag],
  trackingPixels: null,
  latest: {
    __typename: 'ArticleRevision',
    preTitle: null,
    title: 'Title',
    lead: 'Lead',
    seoTitle: null,
    seoDescription: 'Seo Description',
    breaking: true,
    hideAuthor: false,
    canonicalUrl: null,
    socialMediaTitle: null,
    socialMediaDescription: 'Social Description',
    authors: [{ __typename: 'ArticleRevisionAuthor', role: 'Photos', author }],
    socialMediaAuthors: [author, null],
    image,
    socialMediaImage: null,
    properties: [{ key: 'key', value: 'value', public: true }],
    blocks: [],
  },
} as unknown as FullArticleFragment;

describe('articleToArticleMetadata', () => {
  it('should map an article to the editable article metadata', () => {
    expect(articleToArticleMetadata(article)).toEqual({
      slug: 'slug',
      preTitle: '',
      title: 'Title',
      lead: 'Lead',
      seoTitle: '',
      seoDescription: 'Seo Description',
      tags: ['tag-1'],
      defaultTags: [tag],
      url: 'https://example.com/a/slug',
      properties: [{ key: 'key', value: 'value', public: true }],
      canonicalUrl: '',
      shared: true,
      paywall: 'paywall-1',
      hidden: false,
      disableComments: true,
      breaking: true,
      authors: [
        { __typename: 'ArticleRevisionAuthor', role: 'Photos', author },
      ],
      image,
      hideAuthor: false,
      socialMediaTitle: '',
      socialMediaDescription: 'Social Description',
      socialMediaAuthors: [author],
      socialMediaImage: undefined,
      likes: 3,
      trackingPixels: undefined,
    });
  });
});

const templateMetadata = {
  __typename: 'ArticleTemplateMetadata',
  preTitle: null,
  title: 'Title',
  lead: 'Lead',
  seoTitle: 'Seo Title',
  seoDescription: null,
  canonicalUrl: null,
  breaking: true,
  hideAuthor: false,
  shared: true,
  hidden: false,
  disableComments: true,
  paywallId: 'paywall-1',
  socialMediaTitle: null,
  socialMediaDescription: 'Social Description',
  tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
  authors: [
    { __typename: 'ArticleRevisionAuthor', role: 'Photos', author: author },
  ],
  socialMediaAuthors: [author],
  image: image,
  socialMediaImage: null,
  properties: [
    { __typename: 'Property', key: 'key', value: 'value', public: true },
  ],
} as ArticleTemplateMetadataFragment;

describe('articleTemplateMetadataToArticleMetadata', () => {
  it('should map the template metadata to article metadata', () => {
    expect(articleTemplateMetadataToArticleMetadata(templateMetadata)).toEqual({
      preTitle: '',
      title: 'Title',
      lead: 'Lead',
      seoTitle: 'Seo Title',
      seoDescription: '',
      canonicalUrl: '',
      breaking: true,
      hideAuthor: false,
      shared: true,
      hidden: false,
      disableComments: true,
      paywall: 'paywall-1',
      socialMediaTitle: '',
      socialMediaDescription: 'Social Description',
      tags: ['tag-1'],
      defaultTags: [tag],
      authors: [
        { __typename: 'ArticleRevisionAuthor', role: 'Photos', author: author },
      ],
      socialMediaAuthors: [author],
      image: image,
      socialMediaImage: undefined,
      properties: [{ key: 'key', value: 'value', public: true }],
    });
  });
});

describe('articleMetadataToMetadataInput', () => {
  it('should map article metadata to the template input', () => {
    const metadata: ArticleMetadata = {
      ...emptyArticleMetadata,
      slug: 'ignored-slug',
      likes: 10,
      preTitle: '',
      title: 'Title',
      lead: 'Lead',
      breaking: true,
      shared: undefined,
      paywall: 'paywall-1',
      hidden: null,
      tags: ['tag-1'],
      authors: [
        { author: author, role: '' },
        { author: null, role: 'Missing' },
      ],
      socialMediaAuthors: [author],
      image: image,
      properties: [{ key: 'key', value: 'value', public: false }],
    };

    expect(articleMetadataToMetadataInput(metadata)).toEqual({
      preTitle: undefined,
      title: 'Title',
      lead: 'Lead',
      seoTitle: '',
      seoDescription: '',
      canonicalUrl: '',
      breaking: true,
      hideAuthor: false,
      shared: false,
      hidden: false,
      disableComments: false,
      paywallId: 'paywall-1',
      imageID: 'image-1',
      tagIds: ['tag-1'],
      authors: [{ authorId: 'author-1', role: undefined }],
      properties: [{ key: 'key', value: 'value', public: false }],
      socialMediaTitle: undefined,
      socialMediaDescription: undefined,
      socialMediaAuthorIds: ['author-1'],
      socialMediaImageID: undefined,
    });
  });

  it('should round trip template metadata', () => {
    const metadata = {
      ...emptyArticleMetadata,
      ...articleTemplateMetadataToArticleMetadata(templateMetadata),
    };

    expect(articleMetadataToMetadataInput(metadata)).toEqual(
      expect.objectContaining({
        title: 'Title',
        paywallId: 'paywall-1',
        tagIds: ['tag-1'],
        authors: [{ authorId: 'author-1', role: 'Photos' }],
        imageID: 'image-1',
      })
    );
  });
});
