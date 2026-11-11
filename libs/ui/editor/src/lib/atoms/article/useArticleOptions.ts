import { useQuery } from '@apollo/client/react';
import {
  type ArticleListQuery,
  ArticleListDocument,
  ArticleSort,
  SortOrder,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ArticleOption = ArticleListQuery['articles']['nodes'][number];

const noArticles: ArticleOption[] = [];

export function useArticleOptions(selectedArticle?: string | null) {
  const { t } = useTranslation();
  const [knownArticles, setKnownArticles] = useState(noArticles);

  const { data, refetch } = useQuery(ArticleListDocument, {
    variables: {
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
      take: 200,
    },
    fetchPolicy: 'no-cache',
  });

  const selectedKnown =
    !selectedArticle ||
    knownArticles.some(article => article.id === selectedArticle);

  const { data: selectedData } = useQuery(ArticleListDocument, {
    variables: { filter: { ids: [selectedArticle ?? ''] }, take: 1 },
    fetchPolicy: 'no-cache',
    skip: selectedKnown,
  });

  const [seen, setSeen] = useState({ data, selectedData });

  if (seen.data !== data || seen.selectedData !== selectedData) {
    const found = [
      ...(data?.articles.nodes ?? noArticles),
      ...(selectedData?.articles.nodes ?? noArticles),
    ];

    setSeen({ data, selectedData });
    setKnownArticles(previous => [
      ...found,
      ...previous.filter(
        known => !found.some(article => article.id === known.id)
      ),
    ]);
  }

  const articles = data?.articles.nodes ?? noArticles;
  const titleOf = (article: ArticleOption) =>
    article.latest.title || t('articles.overview.untitled');

  return {
    articleIds: articles.map(article => article.id),
    labelFor: (id: string) => {
      const article =
        articles.find(option => option.id === id) ??
        knownArticles.find(known => known.id === id);

      return article ? titleOf(article) : id;
    },
    search: (title: string) => refetch({ filter: { title } }),
  };
}
