import {
  LlmsArticleFragment,
  LlmsContentDocument,
  LlmsPageFragment,
} from '@wepublish/website/api';
import { SitemapClient, SitemapSiteConfig } from '../sitemap';

export type LlmsTxtSiteConfig = Pick<
  SitemapSiteConfig,
  'title' | 'homepageSlug' | 'filterArticle' | 'articleUrl' | 'pageUrl'
> & {
  description?: string;
  llmsArticleCount?: number;
};

export type LlmsTxtContext = {
  client: SitemapClient;
  siteUrl: string;
};

const ARTICLE_COUNT = 100;
const PAGE_COUNT = 100;

const inline = (text: string) => text.replace(/\s+/g, ' ').trim();

const linkText = (text: string) => inline(text).replace(/([[\]\\])/g, '\\$1');

const entry = (title: string, url: string, summary?: string | null) => {
  const link = `- [${linkText(title)}](${url})`;
  const text = summary && inline(summary);

  return text ? `${link}: ${text}` : link;
};

const section = (heading: string, entries: string[]) =>
  entries.length ? [`## ${heading}`, '', ...entries, ''] : [];

const articleEntry = (
  config: LlmsTxtSiteConfig,
  siteUrl: string,
  article: LlmsArticleFragment
) => {
  const title = article.latest.seoTitle || article.latest.title;

  return title ?
      entry(
        title,
        config.articleUrl?.(article, siteUrl) ?? article.url,
        article.latest.seoDescription || article.latest.lead
      )
    : undefined;
};

const pageEntry = (
  config: LlmsTxtSiteConfig,
  siteUrl: string,
  page: LlmsPageFragment
) => {
  const title = page.latest.seoTitle || page.latest.title;

  return title ?
      entry(
        title,
        config.pageUrl?.(page, siteUrl) ?? page.url,
        page.latest.seoDescription || page.latest.description
      )
    : undefined;
};

const isEntry = (value: string | undefined): value is string => !!value;

export const renderLlmsTxt = async (
  config: LlmsTxtSiteConfig,
  { client, siteUrl }: LlmsTxtContext
) => {
  const { data } = await client.query({
    query: LlmsContentDocument,
    variables: {
      articleCount: config.llmsArticleCount ?? ARTICLE_COUNT,
      pageCount: PAGE_COUNT,
    },
    fetchPolicy: 'no-cache',
  });

  const homepageSlug = config.homepageSlug ?? '';
  const pages = (data?.pages.nodes ?? [])
    .filter(({ slug }) => slug !== homepageSlug)
    .map(page => pageEntry(config, siteUrl, page))
    .filter(isEntry);
  const articles = (data?.articles.nodes ?? [])
    .filter(article => !article.peerId)
    .filter(article => config.filterArticle?.(article) ?? true)
    .map(article => articleEntry(config, siteUrl, article))
    .filter(isEntry);

  return [
    `# ${inline(config.title)}`,
    '',
    ...(config.description ? [`> ${inline(config.description)}`, ''] : []),
    ...section('Pages', [entry(config.title, siteUrl), ...pages]),
    ...section('Articles', articles),
  ].join('\n');
};
