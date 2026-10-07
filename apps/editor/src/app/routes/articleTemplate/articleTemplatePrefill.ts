import { useQuery } from '@apollo/client/react';
import {
  ArticleDocument,
  ArticleTemplateDocument,
  FullArticleFragment,
  FullArticleTemplateFragment,
  FullBlockFragment,
} from '@wepublish/editor/api';
import {
  ArticleMetadata,
  blockForQueryBlock,
  BlockValue,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';

import {
  ArticleTemplateArticleMetadata,
  articleTemplateMetadataToArticleMetadata,
  articleToArticleMetadata,
} from '../articles/articleMapping';

export type ArticleTemplatePrefill = {
  name: string;
  blocks: BlockValue[];
  metadata: ArticleTemplateArticleMetadata;
};

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

function usePrefillOnce<Source extends { id: string }>(
  source: Source | null | undefined,
  toPrefill: (source: Source) => ArticleTemplatePrefill,
  onPrefill: OnPrefill
) {
  const [prefilledId, setPrefilledId] = useState<string | null>(null);

  useEffect(() => {
    if (!source || prefilledId === source.id) {
      return;
    }

    setPrefilledId(source.id);
    onPrefill(toPrefill(source));
  }, [source, prefilledId, toPrefill, onPrefill]);

  return !!source && prefilledId !== source.id;
}

export function useArticleTemplatePrefill(
  templateId: string | null | undefined,
  onPrefill: OnPrefill
) {
  const { data, loading } = useQuery(ArticleTemplateDocument, {
    variables: { id: templateId ?? '' },
    skip: !templateId,
    fetchPolicy: 'network-only',
  });

  const isPrefilling = usePrefillOnce(
    data?.articleTemplate,
    articleTemplateToPrefill,
    onPrefill
  );

  return { loading: loading || isPrefilling };
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

  const isPrefilling = usePrefillOnce(
    data?.article,
    articleToPrefill,
    onPrefill
  );

  return { loading: loading || isPrefilling };
}
