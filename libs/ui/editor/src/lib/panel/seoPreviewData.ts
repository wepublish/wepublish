import { FullImageFragment } from '@wepublish/editor/api';

import { SeoBlockContext } from '../blocks/blocksToPlaintext';

export enum SeoContentType {
  Article = 'article',
  Page = 'page',
}

export interface SeoPreviewMetadata {
  title?: string | null;
  lead?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  socialMediaTitle?: string | null;
  socialMediaDescription?: string | null;
  canonicalUrl?: string | null;
  url?: string | null;
  image?: FullImageFragment | null;
  socialMediaImage?: FullImageFragment | null;
}

export interface SeoPreviewData {
  title?: string;
  documentTitle?: string;
  description?: string;
  socialTitle?: string;
  socialDescription?: string;
  image?: FullImageFragment;
  url?: string;
  domain?: string;
  ignoredFields: ('seoTitle' | 'seoDescription')[];
}

const firstOf = (...values: (string | null | undefined)[]) =>
  values.find(value => !!value?.trim())?.trim();

export const getDomain = (url: string | null | undefined) => {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};

export const getSeoPreviewData = (
  type: SeoContentType,
  metadata: SeoPreviewMetadata,
  context: Partial<
    Pick<SeoBlockContext, 'firstTitle' | 'firstParagraph' | 'firstImage'>
  >,
  siteName?: string | null
): SeoPreviewData => {
  const image =
    metadata.socialMediaImage ??
    metadata.image ??
    context.firstImage ??
    undefined;

  const preview =
    type === SeoContentType.Article ?
      {
        title: firstOf(
          metadata.seoTitle,
          metadata.title,
          context.firstTitle,
          metadata.socialMediaTitle
        ),
        socialTitle: firstOf(
          metadata.socialMediaTitle,
          metadata.seoTitle,
          metadata.title,
          context.firstTitle
        ),
        description: firstOf(
          metadata.seoDescription,
          metadata.lead,
          context.firstParagraph
        ),
        socialDescription: firstOf(
          metadata.socialMediaDescription,
          metadata.seoDescription,
          metadata.lead,
          context.firstParagraph
        ),
        url: firstOf(metadata.canonicalUrl, metadata.url),
        ignoredFields: [] as SeoPreviewData['ignoredFields'],
      }
    : {
        title: firstOf(
          metadata.title,
          context.firstTitle,
          metadata.socialMediaTitle
        ),
        socialTitle: firstOf(
          metadata.socialMediaTitle,
          metadata.title,
          context.firstTitle
        ),
        description: firstOf(
          metadata.socialMediaDescription,
          metadata.lead,
          context.firstParagraph
        ),
        socialDescription: firstOf(
          metadata.socialMediaDescription,
          metadata.lead,
          context.firstParagraph
        ),
        url: firstOf(metadata.url),
        ignoredFields: (['seoTitle', 'seoDescription'] as const).filter(
          field => !!metadata[field]?.trim()
        ),
      };

  const name = siteName?.trim();

  return {
    ...preview,
    image,
    documentTitle:
      preview.title && name ?
        `${preview.title} — ${name}`
      : (preview.title ?? name),
    domain: getDomain(preview.url),
  };
};
