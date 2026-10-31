import { DocumentRootProps } from '@wepublish/puck-content/editor';

import { PuckDocumentKind } from './document/document';

export const rootOgTypes = {
  page: 'website',
  article: 'article',
} as const satisfies Record<PuckDocumentKind, string>;

export const resolveRootSEO = ({
  title,
  lead,
  seoTitle,
  seoDescription,
  socialMediaTitle,
  socialMediaDescription,
}: DocumentRootProps) => ({
  title: seoTitle || title || socialMediaTitle,
  description: seoDescription || lead || socialMediaDescription,
  socialMediaTitle: socialMediaTitle || seoTitle || title,
  socialMediaDescription: socialMediaDescription || seoDescription || lead,
});
