/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';

const API_URL = process.env.API_URL ?? 'https://api-reflekt.wepublish.cloud';
const GRAPHQL_ENDPOINT = `${API_URL.replace(/\/$/, '')}/v1`;
const REDIRECTS_PATH = path.resolve(__dirname, '..', 'redirects.json');
const PAGE_SIZE = 50;

const ARTICLE_LIST_QUERY = /* GraphQL */ `
  query AllArticles($take: Int, $skip: Int) {
    articles(take: $take, skip: $skip) {
      nodes {
        id
        slug
        url
      }
      pageInfo {
        hasNextPage
      }
      totalCount
    }
  }
`;

type Article = {
  id: string;
  slug: string | null;
  url: string | null;
};

type ArticleListResponse = {
  data?: {
    articles: {
      nodes: Article[];
      pageInfo: { hasNextPage: boolean };
      totalCount: number;
    };
  };
  errors?: Array<{ message: string }>;
};

type RedirectEntry = {
  destination: string;
  permanent?: boolean;
};

async function fetchPage(skip: number): Promise<{
  articles: Article[];
  hasNextPage: boolean;
  totalCount: number;
}> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      query: ARTICLE_LIST_QUERY,
      variables: { take: PAGE_SIZE, skip },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const body = (await response.json()) as ArticleListResponse;
  if (body.errors?.length) {
    throw new Error(
      `GraphQL errors: ${body.errors.map(e => e.message).join('; ')}`
    );
  }
  if (!body.data) {
    throw new Error('GraphQL response missing data');
  }

  return {
    articles: body.data.articles.nodes,
    hasNextPage: body.data.articles.pageInfo.hasNextPage,
    totalCount: body.data.articles.totalCount,
  };
}

async function fetchAllArticles(): Promise<Article[]> {
  const all: Article[] = [];
  let skip = 0;
  let pageIndex = 0;
  // Safety cap: 100 pages * 50 = 5000 articles, well above any realistic count.
  while (pageIndex < 100) {
    const { articles, hasNextPage, totalCount } = await fetchPage(skip);
    all.push(...articles);
    console.log(
      `  fetched ${all.length}/${totalCount} articles (page ${pageIndex + 1})`
    );
    if (!hasNextPage) break;
    skip += PAGE_SIZE;
    pageIndex += 1;
  }
  return all;
}

async function main() {
  console.log(`Fetching articles from ${GRAPHQL_ENDPOINT} …`);
  const articles = await fetchAllArticles();
  console.log(`Got ${articles.length} articles.`);

  const existingRaw = await fs.readFile(REDIRECTS_PATH, 'utf-8');
  const existing = JSON.parse(existingRaw) as Record<string, RedirectEntry>;

  let added = 0;
  let skipped = 0;
  for (const article of articles) {
    if (!article.slug) {
      skipped += 1;
      continue;
    }
    const source = `/${article.slug}`;
    const destination = `/a/${article.slug}`;
    if (existing[source]) {
      skipped += 1;
      continue;
    }
    existing[source] = { destination };
    added += 1;
  }

  const sortedKeys = Object.keys(existing).sort();
  const sorted: Record<string, RedirectEntry> = {};
  for (const k of sortedKeys) sorted[k] = existing[k];

  await fs.writeFile(REDIRECTS_PATH, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`Wrote ${REDIRECTS_PATH}`);
  console.log(`  added ${added}, skipped ${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
