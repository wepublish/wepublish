import {
  ArticleTemplateMetadataFragment,
  ArticleTemplateMetadataInput,
  CreateArticleTemplateMutationVariables,
  CreatePageTemplateMutationVariables,
  FullArticleFragment,
  FullPageFragment,
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PageTemplateMetadataFragment,
  PageTemplateMetadataInput,
  UpdateArticleTemplateMutationVariables,
  UpdatePageTemplateMutationVariables,
} from '@wepublish/editor/api';
import {
  ArticleRootProps,
  LoadedPuckDocument,
  PageRootProps,
  PuckData,
  PuckDocument,
  PuckRootPropsByKind,
} from '@wepublish/puck-content/editor';
import { PuckDocumentKind } from '@wepublish/puck-content/website';

import {
  ArticleByline,
  articleRootPropsToInput,
  articleToRootProps,
  compact,
  loadPuckDocument,
  pageRootPropsToInput,
  pageToRootProps,
  toProperty,
} from './puck-document-mapping';

export const TEMPLATE_NAME_PROP = 'templateName';

export type PuckTemplateContent = {
  name: string;
  puckBlocks?: readonly FullPuckBlockFragment[] | null;
  puckRegistry?: FullPuckRegistryFragment | null;
};

export const templateNameOf = (rootProps: unknown) => {
  const name =
    rootProps && typeof rootProps === 'object' ?
      (rootProps as Record<string, unknown>)[TEMPLATE_NAME_PROP]
    : undefined;

  return typeof name === 'string' ? name.trim() : '';
};

export const loadPuckTemplate = <K extends PuckDocumentKind>(
  kind: K,
  template: PuckTemplateContent | null | undefined,
  rootProps: PuckRootPropsByKind[K]
): LoadedPuckDocument<K> => {
  const loaded = loadPuckDocument(
    kind,
    template?.puckBlocks,
    template?.puckRegistry,
    rootProps
  );

  if (!loaded.data) {
    return loaded;
  }

  const root = loaded.data.root as { props?: object };

  return {
    data: {
      ...loaded.data,
      root: {
        ...root,
        props: { ...root.props, [TEMPLATE_NAME_PROP]: template?.name ?? '' },
      },
    } as PuckData<K>,
  };
};

export const articleTemplateToRootProps = (
  metadata: ArticleTemplateMetadataFragment
): ArticleRootProps =>
  compact({
    preTitle: metadata.preTitle,
    title: metadata.title,
    lead: metadata.lead,
    imageId: metadata.image?.id,
    canonicalUrl: metadata.canonicalUrl,
    authorIds: metadata.authors.map(({ author }) => author.id),
    hideAuthor: metadata.hideAuthor,
    tags: metadata.tags.map(({ id }) => id),
    paywallId: metadata.paywallId,
    breaking: metadata.breaking,
    hidden: metadata.hidden,
    disableComments: metadata.disableComments,
    shared: metadata.shared,
    seoTitle: metadata.seoTitle,
    seoDescription: metadata.seoDescription,
    socialMediaTitle: metadata.socialMediaTitle,
    socialMediaDescription: metadata.socialMediaDescription,
    socialMediaImageId: metadata.socialMediaImage?.id,
    properties: metadata.properties.map(toProperty),
  });

export const pageTemplateToRootProps = (
  metadata: PageTemplateMetadataFragment
): PageRootProps =>
  compact({
    title: metadata.title,
    lead: metadata.description,
    imageId: metadata.image?.id,
    tags: metadata.tags.map(({ id }) => id),
    hidden: metadata.hidden,
    showNavigation: !metadata.hideHeader,
    showFooter: !metadata.hideFooter,
    seoTitle: metadata.seoTitle,
    seoDescription: metadata.seoDescription,
    socialMediaTitle: metadata.socialMediaTitle,
    socialMediaDescription: metadata.socialMediaDescription,
    socialMediaImageId: metadata.socialMediaImage?.id,
    properties: metadata.properties.map(toProperty),
  });

export const articleToTemplateRootProps = (
  article: FullArticleFragment
): ArticleRootProps => {
  const { slug, ...rootProps } = articleToRootProps(article);

  return rootProps;
};

export const pageToTemplateRootProps = (
  page: FullPageFragment
): PageRootProps => {
  const { slug, ...rootProps } = pageToRootProps(page);

  return rootProps;
};

export const toArticleTemplateMetadataInput = (
  props: ArticleRootProps,
  byline?: ArticleByline
): ArticleTemplateMetadataInput => {
  const { slug, ...metadata } = articleRootPropsToInput(
    props,
    undefined,
    byline
  );

  return metadata as ArticleTemplateMetadataInput;
};

export const toPageTemplateMetadataInput = (
  props: PageRootProps
): PageTemplateMetadataInput => {
  const { slug, ...metadata } = pageRootPropsToInput(props);

  return metadata as PageTemplateMetadataInput;
};

export const toCreateArticleTemplateVariables = (
  { puckBlocks, puckRegistry, rootProps }: PuckDocument<'article'>,
  byline?: ArticleByline
): CreateArticleTemplateMutationVariables => ({
  name: templateNameOf(rootProps),
  puckBlocks,
  puckRegistry,
  metadata: toArticleTemplateMetadataInput(rootProps, byline),
});

export const toUpdateArticleTemplateVariables = (
  id: string,
  document: PuckDocument<'article'>,
  byline?: ArticleByline
): UpdateArticleTemplateMutationVariables => ({
  id,
  ...toCreateArticleTemplateVariables(document, byline),
});

export const toCreatePageTemplateVariables = ({
  puckBlocks,
  puckRegistry,
  rootProps,
}: PuckDocument<'page'>): CreatePageTemplateMutationVariables => ({
  name: templateNameOf(rootProps),
  puckBlocks,
  puckRegistry,
  metadata: toPageTemplateMetadataInput(rootProps),
});

export const toUpdatePageTemplateVariables = (
  id: string,
  document: PuckDocument<'page'>
): UpdatePageTemplateMutationVariables => ({
  id,
  ...toCreatePageTemplateVariables(document),
});
