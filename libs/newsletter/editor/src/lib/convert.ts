import type { Data } from '@measured/puck';
import type {
  Gutter,
  ImageRef,
  MergeCondition,
  NewsletterBlock,
  NewsletterDocument,
} from '@wepublish/newsletter';
import { DEFAULT_FOOTER_LEGAL, DEFAULT_GUTTER } from '@wepublish/newsletter';
import { lookupArticle } from './articles';
import { NO_CONDITION } from './condition-field';

/**
 * Translates between Puck's editor data and the stored newsletter document.
 * Prose is edited as one text and split on newlines here, so `- ` bullets and
 * `[Text](url)` links stay easy to write; see `inline.tsx` in the shared lib.
 */

export const toLines = (value: unknown): string[] =>
  typeof value === 'string' ?
    value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  : [];

const fromLines = (lines: string[] | undefined): string =>
  (lines ?? []).join('\n');

const clean = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';

  return text === '' ? undefined : text;
};

export type Props = Record<string, unknown>;

const str = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const toGutter = (value: unknown): Gutter | undefined =>
  value === 'article' || value === 'intro' || value === 'none' ?
    value
  : undefined;

/** Half-filled means no condition rather than a broken one. */
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

/** The image field's value: a CMS image id, or an external URL. */
export interface ImageFieldValue {
  imageId?: string;
  src?: string;
}

export const EMPTY_IMAGE: ImageFieldValue = {};

const toImageRef = (value: unknown): ImageRef | undefined => {
  const raw = value as Partial<ImageFieldValue> | undefined;
  const imageId = clean(raw?.imageId);
  const src = clean(raw?.src);

  if (imageId) {
    return { imageId };
  }

  return src ? { src } : undefined;
};

const fromImageRef = (ref: ImageRef | undefined): ImageFieldValue => ({
  imageId: ref?.imageId,
  src: ref?.imageId ? undefined : ref?.src,
});

export function toBlock(
  type: string,
  props: Props
): NewsletterBlock | undefined {
  const block = toBlockBody(type, props);

  return (
    block && {
      ...block,
      gutter: toGutter(props['gutter']),
      condition: toCondition(props['condition']),
    }
  );
}

function toBlockBody(type: string, props: Props): NewsletterBlock | undefined {
  switch (type) {
    case 'rubric':
      return { type, name: str(props['name']) };
    case 'heading':
      return { type, text: str(props['text']) };
    case 'meta':
      return { type, left: str(props['left']), right: str(props['right']) };
    case 'divider':
      return { type };
    case 'button':
      return { type, label: str(props['label']), href: str(props['href']) };
    case 'text':
      return { type, paragraphs: toLines(props['body']) };
    case 'footer':
      // `legal` is always written: the field showed the editor what it renders,
      // so a later change to the default must not rewrite an approved issue.
      return {
        type,
        title: str(props['title']),
        lines: toLines(props['lines']),
        legal: toLines(props['legal']),
      };
    case 'image':
      return {
        type,
        ...(toImageRef(props['image']) ?? {}),
        alt: str(props['alt']),
        href: clean(props['href']),
        caption: clean(props['caption']),
      };
    case 'panel': {
      const label = clean(props['linkLabel']);
      const href = clean(props['linkHref']);

      return {
        type,
        title: str(props['title']),
        paragraphs: toLines(props['body']),
        image: toImageRef(props['image']),
        link: label && href ? { label, href } : undefined,
      };
    }
    case 'teaser': {
      const article = props['article'] as { id?: unknown } | undefined;
      const articleId = clean(article?.id);

      // A teaser never pointed at an article cannot be stored; dropping it
      // keeps the save working rather than failing the whole document.
      return articleId ?
          {
            type,
            variant: props['variant'] === 'short' ? 'short' : 'big',
            articleId,
          }
        : undefined;
    }
    default:
      return undefined;
  }
}

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
        legal: fromLines(block.legal ?? DEFAULT_FOOTER_LEGAL),
      };
    case 'image':
      return {
        id,
        image: fromImageRef(block),
        alt: block.alt,
        href: block.href ?? '',
        caption: block.caption ?? '',
      };
    case 'panel':
      return {
        id,
        title: block.title,
        body: fromLines(block.paragraphs),
        image: fromImageRef(block.image),
        linkLabel: block.link?.label ?? '',
        linkHref: block.link?.href ?? '',
      };
    case 'teaser':
      return {
        id,
        variant: block.variant,
        article: {
          id: block.articleId,
          title: lookupArticle(block.articleId)?.title || block.articleId,
        },
      };
  }
}

const DEFAULT_FOOTER_BLOCK: NewsletterBlock = {
  type: 'footer',
  title: '',
  lines: [],
};

/**
 * The editor pins the footer, so an issue that arrived without one could
 * never gain one and would publish with no unsubscribe link.
 */
function withFooterBlock(document: NewsletterDocument): NewsletterBlock[] {
  return document.blocks.some(block => block.type === 'footer') ?
      document.blocks
    : [...document.blocks, DEFAULT_FOOTER_BLOCK];
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
    preheader: str(root['preheader']),
    blocks: data.content
      .map(item => toBlock(item.type as string, item.props as Props))
      .filter((block): block is NewsletterBlock => block !== undefined),
  };
}
