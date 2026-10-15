import { useQuery } from '@apollo/client/react';
import {
  FullBlockFragment,
  FullPageFragment,
  FullPageTemplateFragment,
  PageDocument,
  PageTemplateDocument,
} from '@wepublish/editor/api';
import { blockForQueryBlock, PageMetadata } from '@wepublish/ui/editor';

import {
  PageTemplatePageMetadata,
  pageTemplateMetadataToPageMetadata,
  pageToPageMetadata,
} from '../pages/pageMapping';
import { TemplatePrefill, usePrefillOnce } from '../templates/usePrefillOnce';

export type PageTemplatePrefill = TemplatePrefill<PageTemplatePageMetadata>;

type OnPrefill = (prefill: PageTemplatePrefill) => void;

const withoutPageSpecificMetadata = ({
  slug,
  url,
  ...metadata
}: PageMetadata): PageTemplatePageMetadata => metadata;

const pageTemplateToPrefill = ({
  blockTemplate,
  metadata,
}: FullPageTemplateFragment): PageTemplatePrefill => ({
  name: blockTemplate.name,
  blocks: blockTemplate.blocks.map(block =>
    blockForQueryBlock(block as FullBlockFragment)
  ),
  metadata: pageTemplateMetadataToPageMetadata(metadata),
});

const pageToPrefill = (page: FullPageFragment): PageTemplatePrefill => ({
  name: page.latest.title ?? '',
  blocks: page.latest.blocks.map(blockForQueryBlock),
  metadata: withoutPageSpecificMetadata(pageToPageMetadata(page)),
});

export function usePageTemplatePrefill(
  templateId: string | null | undefined,
  onPrefill: OnPrefill
) {
  const { data, loading } = useQuery(PageTemplateDocument, {
    variables: { id: templateId ?? '' },
    skip: !templateId,
    fetchPolicy: 'network-only',
  });

  const isPrefilling = usePrefillOnce(
    data?.pageTemplate,
    pageTemplateToPrefill,
    onPrefill
  );

  return { loading: loading || isPrefilling };
}

export function usePagePrefill(
  pageId: string | null | undefined,
  onPrefill: OnPrefill
) {
  const { data, loading } = useQuery(PageDocument, {
    variables: { id: pageId ?? '' },
    skip: !pageId,
    fetchPolicy: 'network-only',
  });

  const isPrefilling = usePrefillOnce(data?.page, pageToPrefill, onPrefill);

  return { loading: loading || isPrefilling };
}
