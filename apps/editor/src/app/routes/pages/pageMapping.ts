import {
  FullImageFragment,
  FullPageFragment,
  PageTemplateMetadataFragment,
  PageTemplateMetadataInput,
} from '@wepublish/editor/api';
import { PageMetadata } from '@wepublish/ui/editor';

export type PageTemplatePageMetadata = Omit<PageMetadata, 'slug' | 'url'>;

export function pageTemplateMetadataToPageMetadata(
  metadata: Omit<PageTemplateMetadataFragment, '__typename'>
): PageTemplatePageMetadata {
  return {
    title: metadata.title ?? '',
    description: metadata.description ?? '',
    seoTitle: metadata.seoTitle ?? '',
    seoDescription: metadata.seoDescription ?? '',
    hidden: metadata.hidden,
    socialMediaTitle: metadata.socialMediaTitle ?? '',
    socialMediaDescription: metadata.socialMediaDescription ?? '',
    tags: metadata.tags.map(({ id }) => id),
    defaultTags: metadata.tags,
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

export function pageToPageMetadata(page: FullPageFragment): PageMetadata {
  const { latest, slug, url } = page;

  return {
    ...pageTemplateMetadataToPageMetadata({
      ...latest,
      hidden: page.hidden,
      tags: page.tags,
    }),
    slug: slug ?? '',
    url,
  };
}

export function pageMetadataToMetadataInput(
  metadata: PageMetadata
): PageTemplateMetadataInput {
  return {
    title: metadata.title ?? '',
    description: metadata.description,
    seoTitle: metadata.seoTitle || undefined,
    seoDescription: metadata.seoDescription || undefined,
    hidden: metadata.hidden ?? false,
    imageID: metadata.image?.id,
    tagIds: metadata.tags,
    properties: metadata.properties.map(({ key, value, public: isPublic }) => ({
      key,
      value,
      public: isPublic,
    })),
    socialMediaTitle: metadata.socialMediaTitle || undefined,
    socialMediaDescription: metadata.socialMediaDescription || undefined,
    socialMediaImageID: metadata.socialMediaImage?.id || undefined,
  };
}
