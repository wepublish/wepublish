import { Article, PrismaClient } from '@prisma/client';
import { getMaxTake } from '@wepublish/utils/api';

export type ArticleViewMap = Record<string, number>;

/**
 * Turns the page paths reported by an analytics provider into a map of article
 * slug to views. Pages outside of the article prefix and sub pages of articles
 * are left out.
 */
export function toArticleViewMap(
  rows: Array<[path: string | null | undefined, views: number]>,
  articlePrefix: string
): ArticleViewMap {
  return rows.reduce((object, [path, views]) => {
    if (!path?.startsWith(articlePrefix) || !views) {
      return object;
    }

    // Don't include sub pages of the article prefix
    if (path.split('/').length !== articlePrefix.split('/').length) {
      return object;
    }

    object[path.replace(articlePrefix, '')] = views;

    return object;
  }, {} as ArticleViewMap);
}

export async function findMostViewedArticles(
  prisma: PrismaClient,
  articleViewMap: ArticleViewMap,
  { take, skip }: { take?: number | null; skip?: number | null }
): Promise<Article[]> {
  if (!Object.keys(articleViewMap).length) {
    return [];
  }

  // Adding a number (even as string) to an object key ignores sorting
  // So we have to re-sort the array
  const sortedArticleViewMap = Object.entries(articleViewMap).sort(
    ([, a], [, b]) => {
      if (a > b) {
        return -1;
      }

      if (b > a) {
        return 1;
      }

      return 0;
    }
  );

  const slicedArticleViewMap = Object.fromEntries(
    sortedArticleViewMap.slice(skip ?? 0, (skip ?? 0) + getMaxTake(take ?? 10))
  );

  const articles = await prisma.article.findMany({
    where: {
      slug: {
        in: Object.keys(slicedArticleViewMap),
        mode: 'insensitive',
      },
      publishedAt: {
        not: null,
      },
    },
  });

  return articles.sort((a, b) => {
    if (!a.slug || !articleViewMap[a.slug]) {
      return 1;
    }

    if (!b.slug || !articleViewMap[b.slug]) {
      return -1;
    }

    return (
      articleViewMap[a.slug] > articleViewMap[b.slug] ? -1
      : articleViewMap[b.slug] > articleViewMap[a.slug] ? 1
      : 0
    );
  });
}
