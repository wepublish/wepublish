import type { Gutter, ImageRef, NewsletterBlock } from './blocks';
import type { NewsletterDocument } from './document';
import { INLINE_LINK } from './inline';
import type { MergeCondition } from './merge-tags';
import { INTEREST_NAME, MERGE_TAG_HREF, MERGE_TAG_NAME } from './merge-tags';

/**
 * Validates a block document arriving from the browser. Every field ends up
 * in a mail sent to the whole list, so nothing is taken on trust: link
 * schemes (`javascript:` survives React's escaping), unknown block types and
 * malformed conditions are all refused.
 */
export class DocumentError extends Error {}

function fail(path: string, expected: string): never {
  throw new DocumentError(`Invalid document: ${path} ${expected}.`);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'must be an object');
  }

  return value as Record<string, unknown>;
}

function asString(
  value: unknown,
  path: string,
  { max = 5000 }: { max?: number } = {}
): string {
  if (typeof value !== 'string') {
    fail(path, 'must be a string');
  }

  if (value.length > max) {
    fail(path, `must be at most ${max} characters long`);
  }

  return value;
}

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || value === '';

function asOptionalString(value: unknown, path: string): string | undefined {
  return isBlank(value) ? undefined : asString(value, path);
}

function asStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    fail(path, 'must be a list');
  }

  return value.map((entry, index) => asString(entry, `${path}[${index}]`));
}

/** `[Text](url)` links inside prose never pass `asUrl` on their own. */
function asProseArray(value: unknown, path: string): string[] {
  const paragraphs = asStringArray(value, path);

  paragraphs.forEach((text, index) => {
    for (const match of text.matchAll(INLINE_LINK)) {
      asUrl(match[2], `${path}[${index}] link "${match[1]}"`);
    }
  });

  return paragraphs;
}

function asUrl(value: unknown, path: string): string {
  const raw = asString(value, path, { max: 2000 }).trim();

  if (MERGE_TAG_HREF.test(raw)) {
    return raw;
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return fail(path, 'must be a complete URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail(path, 'must start with http:// or https://');
  }

  return parsed.toString();
}

const IMAGE_ID = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * A CMS image by id, or an external URL. Absent means no image; a block that
 * needs one decides for itself whether that is allowed.
 */
function asImageRef(raw: Record<string, unknown>, path: string): ImageRef {
  const imageId = asOptionalString(raw['imageId'], `${path}.imageId`);

  if (imageId !== undefined) {
    if (!IMAGE_ID.test(imageId)) {
      fail(`${path}.imageId`, 'is not a valid image id');
    }

    return { imageId };
  }

  if (isBlank(raw['src'])) {
    return {};
  }

  return { src: asUrl(raw['src'], `${path}.src`) };
}

const GUTTERS: readonly Gutter[] = ['article', 'intro', 'none'];

const isGutter = (value: string): value is Gutter =>
  (GUTTERS as readonly string[]).includes(value);

function asGutter(value: unknown, path: string): Gutter | undefined {
  const gutter = asOptionalString(value, path);

  if (gutter === undefined) {
    return undefined;
  }

  if (!isGutter(gutter)) {
    fail(path, 'must be "article", "intro" or "none"');
  }

  return gutter;
}

/**
 * An incomplete condition is dropped (the editor passes through that state);
 * a malformed one is refused, because a stray delimiter ends the tag early
 * and leaves the rest as visible text in the mail.
 */
function asCondition(value: unknown, path: string): MergeCondition | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const raw = asRecord(value, path);
  const field = asString(raw['field'] ?? '', `${path}.field`, {
    max: 100,
  }).trim();
  const compared = asString(raw['value'] ?? '', `${path}.value`, {
    max: 200,
  }).trim();

  if (field === '' || compared === '') {
    return undefined;
  }

  const kind = asString(raw['kind'] ?? 'field', `${path}.kind`, { max: 10 });

  if (kind !== 'field' && kind !== 'interest') {
    fail(`${path}.kind`, 'must be "field" or "interest"');
  }

  if (kind === 'interest') {
    if (!INTEREST_NAME.test(field)) {
      fail(
        `${path}.field`,
        'must not contain any of : , * | as a group category'
      );
    }

    if (!INTEREST_NAME.test(compared)) {
      fail(`${path}.value`, 'must not contain any of : , * | as a group name');
    }
  } else {
    if (!MERGE_TAG_NAME.test(field)) {
      fail(`${path}.field`, 'must be a merge field like FNAME');
    }

    if (/[*|]/.test(compared)) {
      fail(`${path}.value`, 'must not contain * or |');
    }
  }

  const operator = asString(raw['operator'] ?? 'is', `${path}.operator`, {
    max: 10,
  });

  if (operator !== 'is' && operator !== 'not') {
    fail(`${path}.operator`, 'must be "is" or "not"');
  }

  return { kind, field, operator, value: compared };
}

function parseBlock(value: unknown, path: string): NewsletterBlock {
  const raw = asRecord(value, path);
  const block = parseBlockBody(raw, path);
  const condition = asCondition(raw['condition'], `${path}.condition`);

  // A conditional footer would pass the publish check while reaching part of
  // the audience with no way to unsubscribe.
  if (condition && block.type === 'footer') {
    fail(
      `${path}.condition`,
      'is not allowed on the footer: unsubscribe link and address must reach everyone'
    );
  }

  return {
    ...block,
    gutter: asGutter(raw['gutter'], `${path}.gutter`),
    condition,
  };
}

function parseBlockBody(
  raw: Record<string, unknown>,
  path: string
): NewsletterBlock {
  const type = asString(raw['type'], `${path}.type`, { max: 50 });

  switch (type) {
    case 'rubric':
      return {
        type,
        name: asString(raw['name'], `${path}.name`, { max: 100 }),
      };

    case 'teaser': {
      const variant = asString(raw['variant'], `${path}.variant`, { max: 10 });

      if (variant !== 'big' && variant !== 'short') {
        fail(`${path}.variant`, 'must be "big" or "short"');
      }

      const articleId = asString(raw['articleId'] ?? '', `${path}.articleId`, {
        max: 100,
      });

      if (!articleId) {
        fail(`${path}.articleId`, 'is missing: pick an article in the editor');
      }

      return { type, variant, articleId };
    }

    case 'heading':
      return {
        type,
        text: asString(raw['text'], `${path}.text`, { max: 300 }),
      };

    case 'text':
      return {
        type,
        paragraphs: asProseArray(raw['paragraphs'], `${path}.paragraphs`),
      };

    case 'image':
      return {
        type,
        ...asImageRef(raw, path),
        alt: asString(raw['alt'] ?? '', `${path}.alt`, { max: 300 }),
        href:
          isBlank(raw['href']) ? undefined : asUrl(raw['href'], `${path}.href`),
        caption: asOptionalString(raw['caption'], `${path}.caption`),
      };

    case 'meta':
      return {
        type,
        left: asString(raw['left'] ?? '', `${path}.left`, { max: 100 }),
        right: asString(raw['right'] ?? '', `${path}.right`, { max: 100 }),
      };

    case 'button':
      return {
        type,
        label: asString(raw['label'], `${path}.label`, { max: 200 }),
        href: asUrl(raw['href'], `${path}.href`),
      };

    case 'panel': {
      const link =
        isBlank(raw['link']) ? undefined : (
          asRecord(raw['link'], `${path}.link`)
        );
      const image =
        isBlank(raw['image']) ?
          {}
        : asImageRef(asRecord(raw['image'], `${path}.image`), `${path}.image`);

      return {
        type,
        title: asString(raw['title'], `${path}.title`, { max: 300 }),
        paragraphs: asProseArray(raw['paragraphs'], `${path}.paragraphs`),
        link: link && {
          label: asString(link['label'], `${path}.link.label`, { max: 200 }),
          href: asUrl(link['href'], `${path}.link.href`),
        },
        image: image.imageId || image.src ? image : undefined,
      };
    }

    case 'divider':
      return { type };

    // `legal` absent means the built-in notice; `legal: []` means the editor
    // deleted it. Both are stored as written and the publish check decides.
    case 'footer':
      return {
        type,
        title: asString(raw['title'] ?? '', `${path}.title`, { max: 200 }),
        lines: asProseArray(raw['lines'] ?? [], `${path}.lines`),
        legal:
          raw['legal'] === undefined || raw['legal'] === null ?
            undefined
          : asProseArray(raw['legal'], `${path}.legal`),
      };

    default:
      return fail(`${path}.type`, `is unknown ("${type}")`);
  }
}

const MAX_BLOCKS = 500;

export function parseDocument(value: unknown): NewsletterDocument {
  const raw = asRecord(value, 'document');
  const blocks = raw['blocks'];

  if (!Array.isArray(blocks)) {
    fail('document.blocks', 'must be a list');
  }

  if (blocks.length > MAX_BLOCKS) {
    fail('document.blocks', `must contain at most ${MAX_BLOCKS} blocks`);
  }

  const parsed = blocks.map((block, index) =>
    parseBlock(block, `block ${index + 1}`)
  );

  if (parsed.filter(block => block.type === 'footer').length > 1) {
    fail('document.blocks', 'must contain at most one footer');
  }

  return {
    preheader: asString(raw['preheader'] ?? '', 'document.preheader', {
      max: 300,
    }),
    blocks: parsed,
  };
}
