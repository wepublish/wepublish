import {
  CreateArticleMutationVariables,
  CreatePageMutationVariables,
  FullArticleFragment,
  FullPageFragment,
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  UpdateArticleMutationVariables,
  UpdatePageMutationVariables,
} from '@wepublish/editor/api';
import {
  ArticleRootProps,
  fromPuckDocument,
  LoadedPuckDocument,
  PageRootProps,
  PuckDocument,
  PuckRootPropsByKind,
  RootProperty,
} from '@wepublish/puck-content/editor';
import { PuckDocumentKind } from '@wepublish/puck-content/website';

type DocumentInput<Variables> = Omit<
  Variables,
  'id' | 'blocks' | 'puckBlocks' | 'puckRegistry' | 'likes'
>;

export type ArticleInput = DocumentInput<UpdateArticleMutationVariables>;
export type PageInput = DocumentInput<UpdatePageMutationVariables>;

type Compact<T> = { [K in keyof T]?: Exclude<T[K], null> };

export const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== ''
    )
  ) as Compact<T>;

export const toProperty = ({ key, value, public: isPublic }: RootProperty) => ({
  key,
  value,
  public: isPublic,
});

export type ArticleByline = {
  authors: ReadonlyArray<{ role?: string | null; author: { id: string } }>;
  socialMediaAuthors: ReadonlyArray<{ id: string } | null | undefined>;
};

const roleOf = (byline: ArticleByline | undefined, authorId: string) =>
  byline?.authors.find(({ author }) => author.id === authorId)?.role ||
  undefined;

export const articleToRootProps = ({
  latest,
  ...article
}: FullArticleFragment): ArticleRootProps =>
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
    paywallId: article.paywallId,
    breaking: latest.breaking,
    hidden: article.hidden,
    disableComments: article.disableComments,
    shared: article.shared,
    seoTitle: latest.seoTitle,
    seoDescription: latest.seoDescription,
    socialMediaTitle: latest.socialMediaTitle,
    socialMediaDescription: latest.socialMediaDescription,
    socialMediaImageId: latest.socialMediaImage?.id,
    properties: latest.properties.map(toProperty),
  });

export const articleRootPropsToInput = (
  props: ArticleRootProps,
  previous?: FullArticleFragment,
  byline: ArticleByline | undefined = previous?.latest
): ArticleInput => ({
  preTitle: props.preTitle || undefined,
  title: props.title,
  lead: props.lead,
  seoTitle: props.seoTitle,
  seoDescription: props.seoDescription,
  canonicalUrl: props.canonicalUrl ?? '',
  slug: props.slug || null,
  breaking: props.breaking ?? false,
  hideAuthor: props.hideAuthor ?? false,
  shared: !!props.shared,
  hidden: props.hidden ?? false,
  disableComments: props.disableComments ?? false,
  paywallId: props.paywallId || null,
  imageID: props.imageId || undefined,
  tagIds: props.tags ?? [],
  authors: (props.authorIds ?? []).map(authorId => ({
    authorId,
    role: roleOf(byline, authorId),
  })),
  properties: (props.properties ?? []).map(toProperty),
  socialMediaTitle: props.socialMediaTitle || undefined,
  socialMediaDescription: props.socialMediaDescription || undefined,
  socialMediaAuthorIds:
    byline?.socialMediaAuthors.flatMap(author => (author ? [author.id] : [])) ??
    [],
  socialMediaImageID: props.socialMediaImageId || undefined,
});

export const toUpdateArticleVariables = (
  id: string,
  { puckBlocks, puckRegistry, rootProps }: PuckDocument<'article'>,
  previous?: FullArticleFragment
): UpdateArticleMutationVariables => ({
  id,
  ...articleRootPropsToInput(rootProps, previous),
  puckBlocks,
  puckRegistry,
});

export const toCreateArticleVariables = (
  { puckBlocks, puckRegistry, rootProps }: PuckDocument<'article'>,
  previous?: FullArticleFragment,
  byline: ArticleByline | undefined = previous?.latest
): CreateArticleMutationVariables => ({
  ...articleRootPropsToInput(rootProps, previous, byline),
  likes: previous?.likes ?? 0,
  puckBlocks,
  puckRegistry,
});

export const pageToRootProps = ({
  latest,
  ...page
}: FullPageFragment): PageRootProps =>
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
    properties: latest.properties.map(toProperty),
  });

export const pageRootPropsToInput = (props: PageRootProps): PageInput => ({
  title: props.title ?? '',
  description: props.lead,
  slug: props.slug ?? '',
  seoTitle: props.seoTitle || undefined,
  seoDescription: props.seoDescription || undefined,
  hidden: props.hidden ?? false,
  hideHeader: props.showNavigation === false,
  hideFooter: props.showFooter === false,
  imageID: props.imageId || undefined,
  tagIds: props.tags ?? [],
  properties: (props.properties ?? []).map(toProperty),
  socialMediaTitle: props.socialMediaTitle || undefined,
  socialMediaDescription: props.socialMediaDescription || undefined,
  socialMediaImageID: props.socialMediaImageId || undefined,
});

export const toUpdatePageVariables = (
  id: string,
  { puckBlocks, puckRegistry, rootProps }: PuckDocument<'page'>
): UpdatePageMutationVariables => ({
  id,
  ...pageRootPropsToInput(rootProps),
  puckBlocks,
  puckRegistry,
});

export const toCreatePageVariables = ({
  puckBlocks,
  puckRegistry,
  rootProps,
}: PuckDocument<'page'>): CreatePageMutationVariables => ({
  ...pageRootPropsToInput(rootProps),
  puckBlocks,
  puckRegistry,
});

export const loadPuckDocument = <K extends PuckDocumentKind>(
  kind: K,
  puckBlocks: readonly FullPuckBlockFragment[] | null | undefined,
  puckRegistry: FullPuckRegistryFragment | null | undefined,
  rootProps: PuckRootPropsByKind[K]
): LoadedPuckDocument<K> =>
  fromPuckDocument(kind, puckBlocks, puckRegistry, rootProps);
