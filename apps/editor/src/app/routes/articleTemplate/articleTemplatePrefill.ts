import { useQuery } from '@apollo/client/react';
import {
  ArticleDocument,
  ArticleTemplateDocument,
  FullArticleFragment,
  FullArticleTemplateFragment,
  FullBlockFragment,
} from '@wepublish/editor/api';
import { ArticleMetadata, blockForQueryBlock } from '@wepublish/ui/editor';

import {
  ArticleTemplateArticleMetadata,
  articleTemplateMetadataToArticleMetadata,
  articleToArticleMetadata,
} from '../articles/articleMapping';
import { TemplatePrefill, usePrefillOnce } from '../templates/usePrefillOnce';

export type ArticleTemplatePrefill =
  TemplatePrefill<ArticleTemplateArticleMetadata>;

type OnPrefill = (prefill: ArticleTemplatePrefill) => void;

const withoutArticleSpecificMetadata = ({
  slug,
  url,
  likes,
  trackingPixels,
  ...metadata
}: ArticleMetadata): ArticleTemplateArticleMetadata => metadata;

const articleTemplateToPrefill = ({
  blockTemplate,
  metadata,
}: FullArticleTemplateFragment): ArticleTemplatePrefill => ({
  name: blockTemplate.name,
  blocks: blockTemplate.blocks.map(block =>
    blockForQueryBlock(block as FullBlockFragment)
  ),
  metadata: articleTemplateMetadataToArticleMetadata(metadata),
});

const articleToPrefill = (
  article: FullArticleFragment
): ArticleTemplatePrefill => ({
  name: article.latest.title ?? '',
  blocks: article.latest.blocks.map(blockForQueryBlock),
  metadata: withoutArticleSpecificMetadata(articleToArticleMetadata(article)),
});

export function useArticleTemplatePrefill(
  templateId: string | null | undefined,
  onPrefill: OnPrefill
) {
  const { data, loading } = useQuery(ArticleTemplateDocument, {
    variables: { id: templateId ?? '' },
    skip: !templateId,
    fetchPolicy: 'network-only',
  });

  usePrefillOnce(data?.articleTemplate, articleTemplateToPrefill, onPrefill);

  return { loading };
}

export function useArticlePrefill(
  articleId: string | null | undefined,
  onPrefill: OnPrefill
) {
  const { data, loading } = useQuery(ArticleDocument, {
    variables: { id: articleId ?? '' },
    skip: !articleId,
    fetchPolicy: 'network-only',
  });

  usePrefillOnce(data?.article, articleToPrefill, onPrefill);

  return { loading };
}
