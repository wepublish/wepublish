import {
  FullNavigationFragment,
  LlmsArticleFragment,
  LlmsContentDocument,
  LlmsPageFragment,
} from '@wepublish/website/api';
import { SitemapClient, SitemapSiteConfig } from '../sitemap';

export type LlmsTxtSiteConfig = Pick<
  SitemapSiteConfig,
  | 'title'
  | 'description'
  | 'homepageSlug'
  | 'filterArticle'
  | 'articleUrl'
  | 'pageUrl'
> & {
  llmsArticleCount?: number;
};

export type LlmsTxtContext = {
  client: SitemapClient;
  siteUrl: string;
  now: Date;
};

type Entry = { title: string; url: string; note?: string | null };

const ARTICLE_COUNT = 10;
const PAGE_COUNT = 20;
const NOTE_LENGTH = 160;
const GATED_PATH = /^\/(login|signup|logout|profile)(\/|$)/;

const inline = (text: string) => text.replace(/\s+/g, ' ').trim();

const linkText = (text: string) => inline(text).replace(/([[\]\\])/g, '\\$1');

const firstSentence = (text: string) => {
  const sentence =
    text.match(/^(.{10,}?[.!?])(?=\s+\p{Lu}|\s*$)/u)?.[1] ?? text;

  if (sentence.length <= NOTE_LENGTH) {
    return sentence;
  }

  const cut = sentence.slice(0, NOTE_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:–—-]+$/, '')}…`;
};

const line = ({ title, url, note }: Entry) => {
  const link = `- [${linkText(title)}](${url})`;
  const text = note && inline(note);

  return text ? `${link}: ${firstSentence(text)}` : link;
};

const section = (heading: string, entries: Entry[]) =>
  entries.length ? [`## ${inline(heading)}`, '', ...entries.map(line), ''] : [];

const normalize = (url: string) => url.replace(/\/$/, '');

const absolute = (url: string, siteUrl: string) =>
  url.startsWith('/') ? `${siteUrl}${url}` : url;

const isGated = (url: string, siteUrl: string) =>
  url.startsWith(siteUrl) && GATED_PATH.test(url.slice(siteUrl.length) || '/');

const linkUrl = (link: FullNavigationFragment['links'][number]) => {
  switch (link.__typename) {
    case 'PageNavigationLink':
      return link.page?.url;
    case 'ArticleNavigationLink':
      return link.article?.url;
    case 'ExternalNavigationLink':
      return link.url;
  }
};

const titled = (
  title: string | null | undefined,
  url: string,
  note?: string | null
): Entry | undefined => (title ? { title, url, note } : undefined);

const isEntry = (entry: Entry | undefined): entry is Entry => !!entry;

const articleEntry = (
  config: LlmsTxtSiteConfig,
  siteUrl: string,
  article: LlmsArticleFragment
) =>
  titled(
    article.latest.seoTitle || article.latest.title,
    config.articleUrl?.(article, siteUrl) ?? article.url,
    article.latest.seoDescription || article.latest.lead
  );

const pageEntry = (
  config: LlmsTxtSiteConfig,
  siteUrl: string,
  page: LlmsPageFragment
) =>
  titled(
    page.latest.seoTitle || page.latest.title,
    config.pageUrl?.(page, siteUrl) ?? page.url,
    page.latest.seoDescription || page.latest.description
  );

const navigationSections = (
  navigations: FullNavigationFragment[],
  siteUrl: string,
  seen: Set<string>
) =>
  navigations.map(({ name, links }) => ({
    heading: name,
    entries: links
      .map(link => {
        const url = linkUrl(link);
        return url ? titled(link.label, absolute(url, siteUrl)) : undefined;
      })
      .filter(isEntry)
      .filter(({ url }) => {
        const key = normalize(url);

        if (seen.has(key) || isGated(url, siteUrl)) {
          return false;
        }

        seen.add(key);
        return true;
      }),
  }));

export const renderLlmsTxt = async (
  config: LlmsTxtSiteConfig,
  { client, siteUrl, now }: LlmsTxtContext
) => {
  const { data } = await client.query({
    query: LlmsContentDocument,
    variables: {
      articleCount: config.llmsArticleCount ?? ARTICLE_COUNT,
      pageCount: PAGE_COUNT,
    },
    fetchPolicy: 'no-cache',
  });

  const home = { title: config.title, url: siteUrl };
  const seen = new Set([normalize(siteUrl)]);
  const navigations = navigationSections(
    data?.navigations ?? [],
    siteUrl,
    seen
  ).filter(({ entries }) => entries.length);

  const homepageSlug = config.homepageSlug ?? '';
  const sections =
    navigations.length ? navigations : (
      [
        {
          heading: 'Pages',
          entries: (data?.pages.nodes ?? [])
            .filter(({ slug }) => slug !== homepageSlug)
            .map(page => pageEntry(config, siteUrl, page))
            .filter(isEntry),
        },
      ]
    );
  sections[0].entries.unshift(home);

  const articles = (data?.articles.nodes ?? [])
    .filter(article => !article.peerId)
    .filter(article => config.filterArticle?.(article) ?? true)
    .map(article => articleEntry(config, siteUrl, article))
    .filter(isEntry);

  return [
    `# ${inline(config.title)}`,
    '',
    ...(config.description ? [`> ${inline(config.description)}`, ''] : []),
    `Last updated: ${now.toISOString().slice(0, 10)}`,
    '',
    ...sections.flatMap(({ heading, entries }) => section(heading, entries)),
    ...section('Latest articles', articles),
  ].join('\n');
};
