import { RootMetadata } from '@wepublish/puck-content/editor';

export const resolveRootSEO = ({
  title,
  lead,
  seoTitle,
  seoDescription,
  socialMediaTitle,
  socialMediaDescription,
}: RootMetadata) => ({
  title: seoTitle || title || socialMediaTitle,
  description: seoDescription || lead || socialMediaDescription,
  socialMediaTitle: socialMediaTitle || seoTitle || title,
  socialMediaDescription: socialMediaDescription || seoDescription || lead,
});
