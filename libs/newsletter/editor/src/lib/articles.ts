import type { ArticleSource } from '@wepublish/newsletter';

/**
 * The editor's view of the article list. One cache backs both the picker and
 * the canvas: a teaser stores only an article id, so the canvas resolves it
 * the same way the server does and the two cannot disagree.
 */
export interface ArticleChoice extends ArticleSource {
  publishedAt: string | null;
  tags: string[];
}

const cache = new Map<string, ArticleChoice>();

export function rememberArticles(articles: ArticleChoice[]): void {
  for (const article of articles) {
    cache.set(article.id, article);
  }
}

export function lookupArticle(
  id: string | undefined
): ArticleChoice | undefined {
  return id ? cache.get(id) : undefined;
}

export function sortNewestFirst(articles: ArticleChoice[]): ArticleChoice[] {
  return [...articles].sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  );
}

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

/** Tags for the filter dropdown, commonest first, with their counts. */
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

export function formatDate(iso: string | null): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ?
      iso.slice(0, 10)
    : `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function leadExcerpt(lead: string | null, max = 110): string {
  const text = (lead ?? '').replace(/\s+/g, ' ').trim();

  if (text.length <= max) {
    return text || '—';
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');

  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()} …`;
}

/**
 * The picker's tag filter, remembered across sessions: Puck resets an
 * external field's filters every time the picker opens, and an issue is
 * assembled by picking a run of articles from the same rubric.
 */
const TAG_STORAGE_KEY = 'wepublish:editor:newsletter:pickerTag';

export function rememberTag(tag: string): void {
  try {
    if (tag) {
      localStorage.setItem(TAG_STORAGE_KEY, tag);
    } else {
      localStorage.removeItem(TAG_STORAGE_KEY);
    }
  } catch {
    // storage can be unavailable; remembering a filter is a convenience
  }
}

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
