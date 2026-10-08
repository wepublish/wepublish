import { SitemapHomepageQuery } from '@wepublish/website/api';

type MaybeDate = string | null | undefined;

// The generated block union is deeply nested; the walker only needs these
// fields, read off whichever block or teaser carries them.
type Teaser = {
  article?: { latest: { publishedAt?: MaybeDate } } | null;
  page?: { latest: { publishedAt?: MaybeDate } } | null;
  event?: { modifiedAt?: MaybeDate } | null;
} | null;

type Block = {
  teasers?: Teaser[];
  flexTeasers?: { teaser?: Teaser }[];
  blocks?: { block?: Block | null }[];
  template?: { modifiedAt?: MaybeDate; blocks?: Block[] } | null;
} | null;

const teaserDate = (teaser: Teaser | undefined): MaybeDate =>
  teaser?.article?.latest.publishedAt ??
  teaser?.page?.latest.publishedAt ??
  teaser?.event?.modifiedAt;

const blockDates = (block: Block): MaybeDate[] => [
  ...(block?.teasers ?? []).map(teaserDate),
  ...(block?.flexTeasers ?? []).map(({ teaser }) => teaserDate(teaser)),
  ...(block?.blocks ?? []).flatMap(({ block }) => blockDates(block ?? null)),
  block?.template?.modifiedAt,
  ...(block?.template?.blocks ?? []).flatMap(blockDates),
];

const newest = (dates: MaybeDate[]) =>
  dates
    .filter((date): date is string => !!date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

/**
 * When the homepage last changed: the newest of its own publication, the
 * articles, pages and events it teases, and the block templates it uses.
 */
export const homepageLastmod = (
  page: SitemapHomepageQuery['page'] | undefined
): string | undefined =>
  page ?
    newest([
      page.latest.publishedAt,
      ...(page.latest.blocks as Block[]).flatMap(blockDates),
    ])
  : undefined;
