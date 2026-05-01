/**
 * EE News teaser selectors (MP-5).
 *
 * Project-specific extractors that wrap wepublish's built-in selectors. Components
 * never reach into raw GraphQL teaser shapes — they call these functions.
 *
 * See `~/.claude/projects/-Users-jpp-Git-wepublish-eenews/memory/eenews-system-design.md` Section 5.
 */
import {
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import type { Teaser } from '@wepublish/website/api';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type TeaserType = Teaser | null | undefined;

/**
 * First (alphabetical or first-listed) tag's label, used as the eyebrow rubrik
 * ("Solar", "Wind", etc.). Returns undefined when no tag is set.
 */
export const selectTeaserRubrik = (teaser: TeaserType): string | undefined => {
  if (!teaser) return undefined;
  if (teaser.__typename === 'ArticleTeaser') {
    const tag = teaser.article?.tags?.[0];
    return tag?.tag ?? undefined;
  }
  if (teaser.__typename === 'PageTeaser') {
    const tag = teaser.page?.tags?.[0];
    return tag?.tag ?? undefined;
  }
  return undefined;
};

/**
 * The article's `topic` property if set (a slug pointing into a topic dictionary).
 * Used for the topic pill overlay on teaser images.
 */
export const selectTeaserTopicSlug = (
  teaser: TeaserType
): string | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') return undefined;
  return teaser.article?.latest?.properties?.find(
    (p: { key: string }) => p.key === 'topic'
  )?.value;
};

/**
 * Read-time minutes from article properties.
 */
export const selectTeaserReadTimeMin = (
  teaser: TeaserType
): number | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') return undefined;
  const raw = teaser.article?.latest?.properties?.find(
    (p: { key: string }) => p.key === 'readTimeMin'
  )?.value;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Localised German date label, e.g. "21. April 2026".
 * Returns undefined when no date is available.
 */
export const selectTeaserDateLabel = (
  teaser: TeaserType
): string | undefined => {
  const iso = teaser ? selectTeaserDate(teaser) : undefined;
  if (!iso) return undefined;
  try {
    return format(new Date(iso), 'd. MMMM yyyy', { locale: de });
  } catch {
    return undefined;
  }
};

/**
 * Combined eyebrow string "Rubrik · Datum". Falls back gracefully when either
 * piece is missing.
 */
export const selectTeaserEyebrow = (teaser: TeaserType): string | undefined => {
  const rubrik = selectTeaserRubrik(teaser);
  const date = selectTeaserDateLabel(teaser);
  if (rubrik && date) return `${rubrik} · ${date}`;
  return rubrik ?? date;
};

// Re-export the wepublish-provided primitives that components also need, so
// teaser components can import them all from one place.
export {
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
};
export const selectTeaserHeadline = selectTeaserTitle;
export const selectTeaserBodyLead = selectTeaserLead;

// ----- Topic-strip helpers (Q21) -----
// Color resolution: per-tag from `Tag.color`, fallback to fixed-position rotation.
const TOPIC_STRIP_PALETTE_FALLBACK = [
  'var(--accent, #c8e26d)',
  'var(--highlight, #f3c969)',
  'var(--accent-deep, #9bb84a)',
  '#a8c9d8',
] as const;

export const selectTopicCardColor = (
  tag: { color?: string | null } | null | undefined,
  slotIndex: number
): string => {
  return (
    tag?.color ||
    TOPIC_STRIP_PALETTE_FALLBACK[
      slotIndex % TOPIC_STRIP_PALETTE_FALLBACK.length
    ]
  );
};
