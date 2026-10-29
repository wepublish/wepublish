import { FullImageFragment } from '@wepublish/editor/api';

import { toSeoPreviewMetadata } from './seo-preview-metadata';

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
      url: 'https://wepublish.ch',
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
      url: undefined,
    });
  });
});
