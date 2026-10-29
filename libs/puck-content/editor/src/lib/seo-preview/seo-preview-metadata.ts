import { FullImageFragment } from '@wepublish/editor/api';
import { SeoPreviewMetadata } from '@wepublish/ui/editor';

import { RootMetadata } from '../seo/seo.field';

export const toSeoPreviewMetadata = (
  rootProps: RootMetadata | undefined,
  images: {
    image?: FullImageFragment;
    socialMediaImage?: FullImageFragment;
  },
  url?: string | null
): SeoPreviewMetadata => ({
  title: rootProps?.title,
  lead: rootProps?.lead,
  seoTitle: rootProps?.seoTitle,
  seoDescription: rootProps?.seoDescription,
  socialMediaTitle: rootProps?.socialMediaTitle,
  socialMediaDescription: rootProps?.socialMediaDescription,
  image: images.image,
  socialMediaImage: images.socialMediaImage,
  url,
});
