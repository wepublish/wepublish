import { FullImageFragment } from '@wepublish/editor/api';

import { SeoBlockContext } from '../blocks/blocksToPlaintext';

export enum SeoContentType {
  Article = 'article',
  Page = 'page',
}

export interface SeoPreviewMetadata {
  readonly title?: string | null;
  readonly lead?: string | null;
  readonly seoTitle?: string | null;
  readonly seoDescription?: string | null;
  readonly socialMediaTitle?: string | null;
  readonly socialMediaDescription?: string | null;
  readonly canonicalUrl?: string | null;
  readonly url?: string | null;
  readonly image?: FullImageFragment | null;
  readonly socialMediaImage?: FullImageFragment | null;
}

export interface SeoPreviewData {
  readonly title?: string;
  readonly documentTitle?: string;
  readonly description?: string;
  readonly socialTitle?: string;
  readonly socialDescription?: string;
  readonly image?: FullImageFragment;
  readonly url?: string;
  readonly domain?: string;
  readonly ignoredFields: ('seoTitle' | 'seoDescription')[];
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
