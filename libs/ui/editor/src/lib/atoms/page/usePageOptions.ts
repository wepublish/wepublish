import { useQuery } from '@apollo/client/react';
import { PageListDocument, PageSort, SortOrder } from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function usePageOptions() {
  const { t } = useTranslation();

  const { data: pageData, refetch } = useQuery(PageListDocument, {
    variables: {
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 200,
    },
    fetchPolicy: 'no-cache',
  });

  const availablePages = useMemo(() => {
    if (!pageData?.pages?.nodes) {
      return [];
    }

    return pageData.pages.nodes.map(page => ({
      label: page.latest.title || t('pages.overview.untitled'),
      value: page.id,
    }));
  }, [pageData, t]);

  const [knownPages, setKnownPages] = useState(pageData?.pages?.nodes ?? []);
  const [seenData, setSeenData] = useState(pageData);

  if (seenData !== pageData) {
    const found = pageData?.pages?.nodes ?? [];

    setSeenData(pageData);
    setKnownPages(previous => [
      ...found,
      ...previous.filter(known => !found.some(page => page.id === known.id)),
    ]);
  }

  const knownLabel = (id: string) => {
    const known = knownPages.find(page => page.id === id);

    return known && (known.latest.title || t('pages.overview.untitled'));
  };

  return {
    pageIds: availablePages.map(page => page.value),
    labelFor: (id: string) =>
      availablePages.find(page => page.value === id)?.label ??
      knownLabel(id) ??
      id,
    search: (title: string) => refetch({ filter: { title } }),
  };
}
