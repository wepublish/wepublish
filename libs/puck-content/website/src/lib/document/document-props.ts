import { PuckArticleQuery, PuckPageQuery } from '@wepublish/website/api';

export const puckDocumentKinds = ['page', 'article'] as const;

export type PuckDocumentKind = (typeof puckDocumentKinds)[number];

export type RootProperty = { key: string; value: string; public: boolean };

export type DocumentRootProps = {
  title?: string;
  lead?: string;
  imageId?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  socialMediaTitle?: string;
  socialMediaDescription?: string;
  socialMediaImageId?: string;
  properties?: RootProperty[];
  hidden?: boolean;
  tags?: string[];
};

export type PageRootProps = DocumentRootProps & {
  showNavigation?: boolean;
  showFooter?: boolean;
};

export type ArticleRootProps = DocumentRootProps & {
  preTitle?: string;
  canonicalUrl?: string;
  authorIds?: string[];
  hideAuthor?: boolean;
  paywallId?: string;
  breaking?: boolean;
  disableComments?: boolean;
  shared?: boolean;
  socialMediaAuthorIds?: string[];
};

type Compacted<T> = { [Key in keyof T]?: NonNullable<T[Key]> };

const compact = <T extends Record<string, unknown>>(value: T): Compacted<T> =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== null && entry !== undefined
    )
  ) as Compacted<T>;

const toRootProperty = ({
  key,
  value,
}: {
  key: string;
  value: string;
}): RootProperty => ({ key, value, public: true });

export const pageRootProps = ({
  latest,
  ...page
}: NonNullable<PuckPageQuery['page']>): PageRootProps =>
  compact({
    title: latest.title,
    lead: latest.description,
    imageId: latest.image?.id,
    slug: page.slug,
    tags: page.tags.map(({ id }) => id),
    hidden: page.hidden,
    showNavigation: !page.hideHeader,
    showFooter: !page.hideFooter,
    seoTitle: latest.seoTitle,
    seoDescription: latest.seoDescription,
    socialMediaTitle: latest.socialMediaTitle,
    socialMediaDescription: latest.socialMediaDescription,
    socialMediaImageId: latest.socialMediaImage?.id,
    properties: latest.properties.map(toRootProperty),
  });

export const articleRootProps = ({
  latest,
  ...article
}: NonNullable<PuckArticleQuery['article']>): ArticleRootProps =>
  compact({
    preTitle: latest.preTitle,
    title: latest.title,
    lead: latest.lead,
    imageId: latest.image?.id,
    slug: article.slug,
    canonicalUrl: latest.canonicalUrl,
    authorIds: latest.authors.map(({ author }) => author.id),
    hideAuthor: latest.hideAuthor,
    tags: article.tags.map(({ id }) => id),
    paywallId: article.paywall?.id,
    breaking: latest.breaking,
    hidden: article.hidden,
    disableComments: article.disableComments,
    seoTitle: latest.seoTitle,
    seoDescription: latest.seoDescription,
    socialMediaTitle: latest.socialMediaTitle,
    socialMediaDescription: latest.socialMediaDescription,
    socialMediaImageId: latest.socialMediaImage?.id,
    properties: latest.properties.map(toRootProperty),
  });
