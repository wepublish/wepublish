import {
  ArticleTemplateMetadataFragment,
  ArticleTemplateMetadataInput,
  FullArticleFragment,
  FullAuthorFragment,
  FullImageFragment,
} from '@wepublish/editor/api';
import { ArticleMetadata } from '@wepublish/ui/editor';

export type ArticleTemplateArticleMetadata = Omit<
  ArticleMetadata,
  'slug' | 'url' | 'likes' | 'trackingPixels'
>;

export function articleTemplateMetadataToArticleMetadata(
  metadata: Omit<ArticleTemplateMetadataFragment, '__typename'>
): ArticleTemplateArticleMetadata {
  return {
    preTitle: metadata.preTitle ?? '',
    title: metadata.title ?? '',
    lead: metadata.lead ?? '',
    seoTitle: metadata.seoTitle ?? '',
    seoDescription: metadata.seoDescription ?? '',
    canonicalUrl: metadata.canonicalUrl ?? '',
    breaking: metadata.breaking,
    hideAuthor: metadata.hideAuthor,
    shared: metadata.shared,
    hidden: metadata.hidden,
    disableComments: metadata.disableComments,
    paywall: metadata.paywallId,
    socialMediaTitle: metadata.socialMediaTitle ?? '',
    socialMediaDescription: metadata.socialMediaDescription ?? '',
    tags: metadata.tags.map(({ id }) => id),
    defaultTags: metadata.tags,
    authors: metadata.authors,
    socialMediaAuthors: metadata.socialMediaAuthors.filter(
      (author): author is FullAuthorFragment => author != null
    ),
    image: (metadata.image as FullImageFragment) ?? undefined,
    socialMediaImage:
      (metadata.socialMediaImage as FullImageFragment) ?? undefined,
    properties: metadata.properties.map(({ key, value, public: isPublic }) => ({
      key,
      value,
      public: isPublic,
    })),
  };
}

export function articleToArticleMetadata(
  article: FullArticleFragment
): ArticleMetadata {
  const { latest, slug, url, likes, trackingPixels } = article;

  return {
    ...articleTemplateMetadataToArticleMetadata({
      ...latest,
      shared: article.shared,
      hidden: article.hidden,
      disableComments: article.disableComments,
      paywallId: article.paywallId,
      tags: article.tags,
    }),
    slug,
    url,
    likes: likes ?? 0,
    trackingPixels: trackingPixels || undefined,
  };
}

export function articleMetadataToMetadataInput(
  metadata: ArticleMetadata
): ArticleTemplateMetadataInput {
  return {
    preTitle: metadata.preTitle || undefined,
    title: metadata.title,
    lead: metadata.lead,
    seoTitle: metadata.seoTitle,
    seoDescription: metadata.seoDescription,
    canonicalUrl: metadata.canonicalUrl,
    breaking: metadata.breaking,
    hideAuthor: metadata.hideAuthor,
    shared: !!metadata.shared,
    hidden: metadata.hidden ?? false,
    disableComments: metadata.disableComments ?? false,
    paywallId: metadata.paywall,
    imageID: metadata.image?.id,
    tagIds: metadata.tags,
    authors: metadata.authors.flatMap(({ author, role }) =>
      author ? [{ authorId: author.id, role: role || undefined }] : []
    ),
    properties: metadata.properties.map(({ key, value, public: isPublic }) => ({
      key,
      value,
      public: isPublic,
    })),
    socialMediaTitle: metadata.socialMediaTitle || undefined,
    socialMediaDescription: metadata.socialMediaDescription || undefined,
    socialMediaAuthorIds: metadata.socialMediaAuthors.map(({ id }) => id),
    socialMediaImageID: metadata.socialMediaImage?.id || undefined,
  };
}
