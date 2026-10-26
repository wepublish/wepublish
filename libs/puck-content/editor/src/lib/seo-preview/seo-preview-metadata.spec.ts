import { FullImageFragment } from '@wepublish/editor/api';

import { toSeoPreviewMetadata } from './seo-preview-metadata';

const image = { id: 'seo-image' } as FullImageFragment;
const socialImage = { id: 'social-image' } as FullImageFragment;

describe('toSeoPreviewMetadata', () => {
  it('maps the SEO and social media root fields onto the editor metadata', () => {
    expect(
      toSeoPreviewMetadata(
        {
          seo: { title: 'Search title', lead: 'Search lead' },
          socialMedia: { title: 'Share title', lead: 'Share lead' },
        },
        { image, socialMediaImage: socialImage },
        'https://wepublish.ch'
      )
    ).toEqual({
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
