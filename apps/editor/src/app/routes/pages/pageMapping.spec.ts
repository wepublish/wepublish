import { FullPageFragment } from '@wepublish/editor/api';

import {
  pageMetadataToMetadataInput,
  pageTemplateMetadataToPageMetadata,
  pageToPageMetadata,
} from './pageMapping';

const image = { __typename: 'Image', id: 'image-1' } as never;
const tag = { __typename: 'Tag' as const, id: 'tag-1', tag: 'Tag' };
const property = {
  __typename: 'Property' as const,
  key: 'key',
  value: 'value',
  public: true,
};

describe('pageTemplateMetadataToPageMetadata', () => {
  it('should map the metadata of a page template', () => {
    expect(
      pageTemplateMetadataToPageMetadata({
        title: 'Title',
        description: null,
        seoTitle: null,
        seoDescription: 'SEO Description',
        hidden: true,
        hideHeader: true,
        hideFooter: false,
        socialMediaTitle: null,
        socialMediaDescription: 'Social Description',
        tags: [tag],
        image,
        socialMediaImage: null,
        properties: [property],
      })
    ).toEqual({
      title: 'Title',
      description: '',
      seoTitle: '',
      seoDescription: 'SEO Description',
      hidden: true,
      hideHeader: true,
      hideFooter: false,
      socialMediaTitle: '',
      socialMediaDescription: 'Social Description',
      tags: ['tag-1'],
      defaultTags: [tag],
      image,
      socialMediaImage: undefined,
      properties: [{ key: 'key', value: 'value', public: true }],
    });
  });
});

describe('pageToPageMetadata', () => {
  it('should map a page with its slug and url', () => {
    const page = {
      __typename: 'Page',
      id: 'page-1',
      slug: null,
      url: 'https://example.com/page',
      hidden: false,
      hideHeader: false,
      hideFooter: true,
      tags: [tag],
      latest: {
        __typename: 'PageRevision',
        title: 'Title',
        description: 'Description',
        seoTitle: null,
        seoDescription: null,
        image: null,
        socialMediaTitle: null,
        socialMediaDescription: null,
        socialMediaImage: image,
        properties: [],
        blocks: [],
      },
    } as unknown as FullPageFragment;

    expect(pageToPageMetadata(page)).toEqual({
      slug: '',
      url: 'https://example.com/page',
      title: 'Title',
      description: 'Description',
      seoTitle: '',
      seoDescription: '',
      hidden: false,
      hideHeader: false,
      hideFooter: true,
      socialMediaTitle: '',
      socialMediaDescription: '',
      tags: ['tag-1'],
      defaultTags: [tag],
      image: undefined,
      socialMediaImage: image,
      properties: [],
    });
  });
});

describe('pageMetadataToMetadataInput', () => {
  it('should map page metadata to the metadata input', () => {
    expect(
      pageMetadataToMetadataInput({
        slug: 'slug',
        url: 'https://example.com/page',
        title: 'Title',
        description: 'Description',
        seoTitle: '',
        seoDescription: 'SEO Description',
        hidden: null,
        hideHeader: true,
        socialMediaTitle: '',
        socialMediaDescription: 'Social Description',
        tags: ['tag-1'],
        defaultTags: [tag],
        image: { id: 'image-1' } as never,
        socialMediaImage: undefined,
        properties: [property],
      })
    ).toEqual({
      title: 'Title',
      description: 'Description',
      seoTitle: undefined,
      seoDescription: 'SEO Description',
      hidden: false,
      hideHeader: true,
      hideFooter: false,
      imageID: 'image-1',
      tagIds: ['tag-1'],
      properties: [{ key: 'key', value: 'value', public: true }],
      socialMediaTitle: undefined,
      socialMediaDescription: 'Social Description',
      socialMediaImageID: undefined,
    });
  });

  it('should default a missing title to an empty one', () => {
    expect(
      pageMetadataToMetadataInput({
        description: '',
        tags: [],
        defaultTags: [],
        url: '',
        properties: [],
      }).title
    ).toBe('');
  });
});
