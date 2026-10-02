/**
 * The editor's view of the wepublish article list.
 *
 * Two jobs, deliberately sharing one cache: it backs the article picker, and it
 * lets the canvas resolve a linked teaser the same way the server does. Without
 * the cache a teaser that stores only an article id would draw as an empty box
 * in the editor while rendering correctly in the sent mail — the worst kind of
 * mismatch, because the editor is where it gets checked.
 */
import {
  DateFilterComparison,
  getApiClientV2,
  NewsletterArticleFragment,
  NewsletterArticlesDocument,
  NewsletterArticlesQuery,
  NewsletterArticlesQueryVariables,
} from '@wepublish/editor/api';
import type { ArticleSource } from '@wepublish/newsletter/email';

export interface ArticleChoice extends ArticleSource {
  publishedAt: string;
  tags: string[];
}

/** How far back the picker looks. */
const DAYS = 90;

/** The API's cap on `take`; the list is paged through with `skip`. */
const PAGE_SIZE = 100;

/** Safety stop so a wide date range can never loop forever. */
const MAX_PAGES = 20;

const cache = new Map<string, ArticleChoice>();
let loaded: Promise<ArticleChoice[]> | undefined;

/**
 * The published revision only, as the server renders it: a teaser for a draft
 * would link readers to a page that does not exist yet.
 */
function toChoice(node: NewsletterArticleFragment): ArticleChoice | null {
  const revision = node.published;
  const title = revision?.title?.trim();

  if (!node.publishedAt || !revision || !title) {
    return null;
  }

  return {
    id: node.id,
    title,
    lead: revision.lead?.trim() || null,
    url: node.url,
    preTitle: revision.preTitle?.trim() || null,
    imageUrl: revision.image?.url ?? null,
    publishedAt: node.publishedAt,
    tags: node.tags
      .map(({ tag }) => tag)
      .filter((tag): tag is string => Boolean(tag)),
  };
}

async function fetchArticles(
  filter: NewsletterArticlesQueryVariables['filter']
): Promise<ArticleChoice[]> {
  const found: ArticleChoice[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await getApiClientV2().query<
      NewsletterArticlesQuery,
      NewsletterArticlesQueryVariables
    >({
      query: NewsletterArticlesDocument,
      variables: { filter, take: PAGE_SIZE, skip: page * PAGE_SIZE },
    });

    for (const node of data.articles.nodes) {
      const choice = toChoice(node);

      if (choice) {
        found.push(choice);
      }
    }

    if (
      !data.articles.pageInfo.hasNextPage ||
      data.articles.nodes.length === 0
    ) {
      break;
    }
  }

  return found;
}

export function rememberArticles(choices: ArticleChoice[]): void {
  for (const choice of choices) {
    cache.set(choice.id, choice);
  }
}

/**
 * Loaded once per editor session and reused.
 *
 * The list is a few hundred articles at most, so fetching it whole beats a
 * search request per keystroke — and it is the same data the canvas needs, so
 * the picker warming the cache is the point rather than a side effect.
 */
export function loadArticles(now = new Date()): Promise<ArticleChoice[]> {
  const from = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);

  loaded ??= fetchArticles({
    published: true,
    publicationDateFrom: {
      comparison: DateFilterComparison.GreaterThanOrEqual,
      date: from.toISOString(),
    },
  })
    .then(choices => {
      rememberArticles(choices);

      return choices;
    })
    .catch((cause: Error) => {
      // Not sticky: a failed load must not poison every later lookup for the
      // rest of the session.
      loaded = undefined;
      throw cause;
    });

  return loaded;
}

/**
 * The document's own teasers, however old their articles are: an issue reopened
 * next spring still has to draw in the canvas, and the picker's 90-day window
 * would simply not contain them.
 */
export async function loadArticlesByIds(ids: string[]): Promise<void> {
  const missing = [...new Set(ids)].filter(id => !cache.has(id));

  if (missing.length) {
    rememberArticles(await fetchArticles({ ids: missing }));
  }
}

export function lookupArticle(
  id: string | undefined
): ArticleSource | undefined {
  return id ? cache.get(id) : undefined;
}

/** Free-text search over title, kicker and lead, plus an optional tag. */
export function searchArticles(
  articles: ArticleChoice[],
  query: string,
  tag?: string
): ArticleChoice[] {
  const needle = query.trim().toLowerCase();
  const wanted = tag?.trim().toLowerCase();

  return articles.filter(article => {
    if (wanted && !article.tags.some(each => each.toLowerCase() === wanted)) {
      return false;
    }

    if (!needle) {
      return true;
    }

    return [article.title, article.preTitle ?? '', article.lead ?? '']
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });
}

/**
 * Tags for the filter dropdown, commonest first.
 *
 * Frequency order rather than alphabetical: the list runs to well over a hundred
 * tags, and the handful an editor actually files by — solar, wind, wasser — would
 * otherwise be scattered among one-off topic tags. The count is in the label so
 * a tag matching two articles is visibly not worth picking.
 */
export function tagOptions(
  articles: ArticleChoice[],
  allLabel: string
): { label: string; value: string }[] {
  const counts = new Map<string, number>();

  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [
    { label: allLabel, value: '' },
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ label: `${tag} (${count})`, value: tag })),
  ];
}

/** `13.8.2026` — the format the newsletter's own date row uses. */
export function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ?
      iso.slice(0, 10)
    : `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

/** First words of the lead, for the picker's list rows. */
export function leadExcerpt(lead: string | null, max = 110): string {
  const text = (lead ?? '').replace(/\s+/g, ' ').trim();

  if (text.length <= max) {
    return text || '—';
  }

  // Cut on a word boundary so the excerpt does not end mid-word.
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');

  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()} …`;
}

/**
 * The picker's tag filter, remembered across sessions.
 *
 * An issue is assembled by picking a run of articles out of the same rubric, and
 * Puck resets an external field's filters to `initialFilters` every time the
 * picker is opened — so without this the tag has to be chosen again for every
 * single teaser. Kept in localStorage rather than a module variable so it also
 * survives the reload after a save.
 */
const TAG_STORAGE_KEY = 'newsletter.picker.tag';

export function rememberTag(tag: string): void {
  try {
    if (tag) {
      localStorage.setItem(TAG_STORAGE_KEY, tag);
    } else {
      localStorage.removeItem(TAG_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable or full (private windows, blocked cookies).
    // Remembering a filter is a convenience — it must never break the picker.
  }
}

/**
 * The remembered tag, discarded unless the current list still carries it.
 *
 * Tags age out of the picker's 90-day window. Restoring one that no longer
 * matches anything would open the picker on an empty table, which reads as
 * "there are no articles" rather than "your old filter matched nothing".
 */
export function rememberedTag(articles: ArticleChoice[]): string {
  let stored: string | null = null;

  try {
    stored = localStorage.getItem(TAG_STORAGE_KEY);
  } catch {
    return '';
  }

  const tag = stored ?? '';

  return tag && articles.some(article => article.tags.includes(tag)) ? tag : '';
}
