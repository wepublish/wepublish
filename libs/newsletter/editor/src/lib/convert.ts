/**
 * Translates between Puck's editor data and the stored newsletter document.
 *
 * The two shapes are close but not identical, and the difference is deliberate:
 * Puck's array fields hold objects rather than strings, which would make a
 * paragraph list awkward to type into. Prose is edited as one textarea and split
 * on newlines here, so `- ` bullet lines and `[Text](url)` links stay easy to
 * write. See `inline.tsx` in `@wepublish/newsletter/email` for what that markup
 * supports.
 *
 * The email renderer never sees Puck's shape — the document stored in the
 * database is the one `parseDocument` validates and `renderBlock` draws.
 */
import type { Data } from '@puckeditor/core';
import type {
  Gutter,
  MergeCondition,
  NewsletterBlock,
  NewsletterDocument,
} from '@wepublish/newsletter/email';
import {
  BLANK_FOOTER,
  DEFAULT_FOOTER_LEGAL,
  DEFAULT_GUTTER,
} from '@wepublish/newsletter/email';
import { lookupArticle } from './articles';
import { NO_CONDITION } from './condition-field';

export type { NewsletterDocument };

export const toLines = (value: unknown): string[] =>
  typeof value === 'string' ?
    value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  : [];

const fromLines = (lines: string[] | undefined): string =>
  (lines ?? []).join('\n');

/** Blank optional fields come back from Puck as `''`; the document wants them gone. */
const clean = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';

  return text === '' ? undefined : text;
};

export type Props = Record<string, unknown>;

const str = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/** Anything else becomes `undefined`, so `renderBlock` applies the block default. */
const toGutter = (value: unknown): Gutter | undefined =>
  value === 'article' || value === 'intro' || value === 'none' ?
    value
  : undefined;

/**
 * The dynamic-content row, as a stored condition.
 *
 * Half-filled means *no* condition rather than a broken one: the row is two
 * dropdowns and a value, so "field chosen, value not chosen yet" is a state an
 * editor passes through on the way to every condition they set. Dropping it here
 * keeps the document free of a condition that `conditionTags` would ignore
 * anyway — and it is what `parseDocument` does with one that arrives regardless.
 *
 * `kind` is narrowed rather than trusted: it decides which tag the condition is
 * written into, and anything but `interest` means the `IF` form.
 */
const toCondition = (value: unknown): MergeCondition | undefined => {
  const raw = value as Partial<MergeCondition> | undefined;
  const field = clean(raw?.field);
  const compared = clean(raw?.value);

  return field && compared ?
      {
        kind: raw?.kind === 'interest' ? 'interest' : 'field',
        field,
        operator: raw?.operator === 'not' ? 'not' : 'is',
        value: compared,
      }
    : undefined;
};

/**
 * Also used by the Puck config to draw a block from the props being edited.
 *
 * Every block carries the same `Einzug` and the same condition, so both are
 * attached here rather than in each branch of the switch below. The footer has
 * no condition field — see `config.tsx` — so `props.condition` is absent there
 * and this leaves it that way; `parseDocument` refuses one that arrives anyway.
 */
export function toBlock(
  type: string,
  props: Props
): NewsletterBlock | undefined {
  const block = toBlockBody(type, props);

  return (
    block && {
      ...block,
      gutter: toGutter(props.gutter),
      condition: toCondition(props.condition),
    }
  );
}

function toBlockBody(type: string, props: Props): NewsletterBlock | undefined {
  switch (type) {
    case 'rubric':
      return { type, name: str(props.name) };
    case 'heading':
      return { type, text: str(props.text) };
    case 'meta':
      return { type, left: str(props.left), right: str(props.right) };
    case 'divider':
      return { type };
    case 'button':
      return { type, label: str(props.label), href: str(props.href) };
    case 'text':
      return { type, paragraphs: toLines(props.body) };
    case 'footer':
      // `legal` is always written, never left absent: the field showed the
      // editor whatever it was going to render, so storing "use the default"
      // after they have looked at it would let a later change to
      // `DEFAULT_FOOTER_LEGAL` silently rewrite an issue that was already
      // approved.
      return {
        type,
        title: str(props.title),
        lines: toLines(props.lines),
        legal: toLines(props.legal),
      };
    case 'image':
      return {
        type,
        imageId: clean(props.imageId),
        alt: str(props.alt),
        href: clean(props.href),
        caption: clean(props.caption),
      };
    case 'panel': {
      const label = clean(props.linkLabel);
      const href = clean(props.linkHref);

      return {
        type,
        title: str(props.title),
        paragraphs: toLines(props.body),
        imageId: clean(props.imageId),
        // Both halves or neither — a label with no target renders as dead text.
        link: label && href ? { label, href } : undefined,
      };
    }
    case 'teaser': {
      // The picker hands back the whole article; only its id is kept. Headline,
      // kicker, lead, link and image come from the CMS at render time, so there
      // is nothing here for an editor to type over or for time to make stale.
      const article = props.article as { id?: unknown } | undefined;
      const articleId = clean(article?.id);

      // A teaser dropped in but never pointed at an article cannot be stored;
      // dropping the block keeps the save working and the empty slot visibly
      // disappears rather than failing the whole document.
      return articleId ?
          {
            type,
            variant: props.variant === 'short' ? 'short' : 'big',
            articleId,
          }
        : undefined;
    }
    default:
      // A component Puck knows about but this function does not would otherwise
      // vanish silently on the next save.
      return undefined;
  }
}

/**
 * The radio needs a value to show, so a block with no stored `Einzug` gets the
 * one `renderBlock` would have used.
 *
 * The condition row is likewise always given an object, because its three
 * controls read from one: `NO_CONDITION` is the empty one, and a block that
 * stores none opens on "Immer anzeigen". The footer gets no such prop — it is
 * the one block with no condition field, and a prop with no field to render it
 * would ride along through every save.
 */
function toProps(block: NewsletterBlock, index: number): Props {
  return {
    ...toFieldProps(block, index),
    gutter: block.gutter ?? DEFAULT_GUTTER[block.type],
    ...(block.type === 'footer' ?
      {}
    : { condition: block.condition ?? NO_CONDITION }),
  };
}

function toFieldProps(block: NewsletterBlock, index: number): Props {
  const id = `${block.type}-${index}`;

  switch (block.type) {
    case 'rubric':
      return { id, name: block.name };
    case 'heading':
      return { id, text: block.text };
    case 'meta':
      return { id, left: block.left, right: block.right };
    case 'divider':
      return { id };
    case 'button':
      return { id, label: block.label, href: block.href };
    case 'text':
      return { id, body: fromLines(block.paragraphs) };
    case 'footer':
      return {
        id,
        title: block.title,
        lines: fromLines(block.lines),
        // What `NewsletterFooter` would draw, so the field opens on the notice
        // the issue actually carries rather than on an empty box.
        legal: fromLines(block.legal ?? DEFAULT_FOOTER_LEGAL),
      };
    case 'image':
      return {
        id,
        imageId: block.imageId ?? '',
        alt: block.alt,
        href: block.href ?? '',
        caption: block.caption ?? '',
      };
    case 'panel':
      return {
        id,
        title: block.title,
        body: fromLines(block.paragraphs),
        imageId: block.imageId ?? '',
        linkLabel: block.link?.label ?? '',
        linkHref: block.link?.href ?? '',
      };
    case 'teaser':
      return {
        id,
        variant: block.variant,
        // The title is read from the cached article list, not from the block:
        // a stored teaser carries the id alone, so the picker's chip would name
        // a block `xk3f…` while the canvas beside it shows the headline.
        // `toPuckData` runs after `loadArticles`, so the cache is warm; an
        // article the CMS no longer returns keeps the id, which is what the
        // canvas's "konnte nicht geladen werden" note names too.
        article: {
          id: block.articleId,
          title: lookupArticle(block.articleId)?.title || block.articleId,
        },
      };
  }
}

/**
 * The document's blocks, with the closing block guaranteed to be among them.
 *
 * The editor pins that block — no drag, duplicate, delete or insert — so an
 * issue that arrived without one (assembled through the API) could never gain
 * one, and would publish with no unsubscribe link.
 */
function withFooterBlock(document: NewsletterDocument): NewsletterBlock[] {
  return document.blocks.some(block => block.type === 'footer') ?
      document.blocks
    : [...document.blocks, BLANK_FOOTER];
}

export function toPuckData(document: NewsletterDocument): Data {
  return {
    root: { props: { preheader: document.preheader } },
    content: withFooterBlock(document).map((block, index) => ({
      type: block.type,
      props: toProps(block, index),
    })),
  } as Data;
}

export function fromPuckData(data: Data): NewsletterDocument {
  const root = (data.root?.props ?? {}) as Props;

  return {
    preheader: str(root.preheader),
    blocks: data.content
      .map(item => toBlock(item.type as string, item.props as Props))
      .filter((block): block is NewsletterBlock => block !== undefined),
  };
}
