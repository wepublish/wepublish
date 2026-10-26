import { FullImageFragment } from '@wepublish/editor/api';
import { SeoPreviewMetadata } from '@wepublish/ui/editor';

import { SEOValue } from '../seo/seo.field';

export type RootSEOProps = {
  seo?: SEOValue;
  socialMedia?: SEOValue;
};

export const toSeoPreviewMetadata = (
  rootProps: RootSEOProps | undefined,
  images: {
    image?: FullImageFragment;
    socialMediaImage?: FullImageFragment;
  },
  url?: string | null
): SeoPreviewMetadata => ({
  seoTitle: rootProps?.seo?.title,
  seoDescription: rootProps?.seo?.lead,
  socialMediaTitle: rootProps?.socialMedia?.title,
  socialMediaDescription: rootProps?.socialMedia?.lead,
  image: images.image,
  socialMediaImage: images.socialMediaImage,
  url,
});
