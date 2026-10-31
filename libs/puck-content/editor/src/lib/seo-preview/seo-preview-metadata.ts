import { FullImageFragment } from '@wepublish/editor/api';
import { SeoContentType, SeoPreviewMetadata } from '@wepublish/ui/editor';

import { PuckEditorDocumentKind } from '../document-kind/document-kind';
import { ArticleRootProps, DocumentRootProps } from '../root/root.field';

export type SeoPreviewRootProps = DocumentRootProps &
  Pick<ArticleRootProps, 'canonicalUrl'>;

export const seoContentTypes = {
  page: SeoContentType.Page,
  article: SeoContentType.Article,
} satisfies Record<PuckEditorDocumentKind, SeoContentType>;

export const toSeoPreviewMetadata = (
  rootProps: SeoPreviewRootProps | undefined,
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
  canonicalUrl: rootProps?.canonicalUrl,
  url,
});
