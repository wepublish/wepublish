/**
 * Validates a block document arriving from the browser.
 *
 * Every field here ends up in an email that goes to the whole mailing list, so
 * nothing is taken on trust. Three things this is really guarding:
 *
 * - **Link schemes.** A block's `href` becomes an anchor in the sent mail.
 *   React escapes the *text* of a block, but `href="javascript:…"` is not text —
 *   it survives escaping untouched. Only http(s) and Mailchimp's own `*|TAG|*`
 *   merge tags are allowed through.
 * - **Unknown block types.** `renderBlock` switches exhaustively; a type it has
 *   never heard of would render as nothing at all and the editor would show a
 *   silently empty issue. Better to reject the save.
 * - **Conditions.** A block's dynamic-content condition is not text in the mail
 *   but a merge *tag* around it, so a stray delimiter in what it names ends that
 *   tag early and leaves the rest as visible gibberish — see `asCondition`.
 */
import { BadRequestException } from '@nestjs/common';
import type {
  Gutter,
  MergeCondition,
  NewsletterBlock,
  NewsletterDocument,
} from '@wepublish/newsletter/email';
import {
  INLINE_LINK,
  INTEREST_NAME,
  MERGE_TAG_HREF,
  MERGE_TAG_NAME,
} from '@wepublish/newsletter/email';

export class DocumentError extends BadRequestException {}

function fail(path: string, expected: string): never {
  throw new DocumentError(`Ungültiges Dokument: ${path} ${expected}.`);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'muss ein Objekt sein');
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown, path: string, { max = 5000 } = {}): string {
  if (typeof value !== 'string') {
    fail(path, 'muss Text sein');
  }

  if (value.length > max) {
    fail(path, `darf höchstens ${max} Zeichen lang sein`);
  }

  return value;
}

/** Absent, null and `''` all mean "not set" — the editor sends all three. */
const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || value === '';

function asOptionalString(value: unknown, path: string): string | undefined {
  return isBlank(value) ? undefined : asString(value, path);
}

function asStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    fail(path, 'muss eine Liste sein');
  }

  return value.map((entry, index) => asString(entry, `${path}[${index}]`));
}

/**
 * Paragraph text may carry `[Text](url)` links, and those URLs never pass
 * through `asUrl` on their own — they are just characters inside a string. Left
 * unchecked they would be the one way a `javascript:` href could still reach the
 * sent mail.
 */
function asProseArray(value: unknown, path: string): string[] {
  const paragraphs = asStringArray(value, path);

  paragraphs.forEach((text, index) => {
    for (const match of text.matchAll(INLINE_LINK)) {
      asUrl(match[2], `${path}[${index}] Link "${match[1]}"`);
    }
  });

  return paragraphs;
}

/**
 * Mailchimp merge tags are legitimate hrefs (`*|UNSUB|*`) and are not URLs, so
 * they are matched before parsing rather than after. `MERGE_TAG_HREF` says what
 * counts as one, and why letting it through is safe.
 */
function asUrl(value: unknown, path: string): string {
  const raw = asString(value, path, { max: 2000 }).trim();

  if (MERGE_TAG_HREF.test(raw)) {
    return raw;
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return fail(path, 'muss eine vollständige URL sein');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail(path, 'muss mit http:// oder https:// beginnen');
  }

  return parsed.toString();
}

/**
 * An image is the id of an image in the media library, never a URL: the URL is
 * made at render time, in a format every mail client can read. Absent means the
 * editor has not picked one yet.
 */
function asImageId(value: unknown, path: string): string | undefined {
  return isBlank(value) ? undefined : asString(value, path, { max: 100 });
}

/** Absent means "whatever this block's default is"; `renderBlock` resolves it. */
function asGutter(value: unknown, path: string): Gutter | undefined {
  const gutter = asOptionalString(value, path);

  if (gutter === 'article' || gutter === 'intro' || gutter === 'none') {
    return gutter;
  }

  if (gutter === undefined) {
    return undefined;
  }

  return fail(path, 'muss "article", "intro" oder "none" sein');
}

/**
 * A block's dynamic-content condition — the tag pair `renderBlock` wraps the
 * block in, either `*|IF:…|*` or `*|INTERESTED:…|*`.
 *
 * An *incomplete* one is dropped rather than refused: an editor who picked a
 * merge field and has not chosen a value yet has written a document that is
 * merely unfinished, and refusing the save would lose the rest of their work.
 * `conditionTags` makes the same call at render time, so a half-chosen condition
 * shows the block to everyone in the preview and in the mail alike.
 *
 * A *malformed* one is refused, because it would reach the audience as visible
 * gibberish rather than as a condition: a delimiter inside what the condition
 * names ends the tag early, leaving the rest of it as text in the mail — and
 * Mailchimp would then evaluate a condition nobody wrote.
 */
function asCondition(value: unknown, path: string): MergeCondition | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const raw = asRecord(value, path);
  const field = asString(raw.field ?? '', `${path}.field`, { max: 100 }).trim();
  const compared = asString(raw.value ?? '', `${path}.value`, {
    max: 200,
  }).trim();

  if (field === '' || compared === '') {
    return undefined;
  }

  const kind = asString(raw.kind ?? 'field', `${path}.kind`, { max: 10 });

  if (kind !== 'field' && kind !== 'interest') {
    fail(`${path}.kind`, 'muss "field" oder "interest" sein');
  }

  // The two kinds are written into different tags, so they are malformed
  // differently: a merge field is an upper-case name compared inside an `IF`,
  // while a group is a category title and a group name inside an `INTERESTED`
  // tag that parses on `:` and `,`.
  if (kind === 'interest') {
    if (!INTEREST_NAME.test(field)) {
      fail(
        `${path}.field`,
        'darf als Gruppen-Kategorie keines der Zeichen : , * | enthalten'
      );
    }

    if (!INTEREST_NAME.test(compared)) {
      fail(
        `${path}.value`,
        'darf als Gruppenname keines der Zeichen : , * | enthalten'
      );
    }
  } else {
    if (!MERGE_TAG_NAME.test(field)) {
      fail(`${path}.field`, 'muss ein Merge-Feld wie FNAME sein');
    }

    if (/[*|]/.test(compared)) {
      fail(`${path}.value`, 'darf kein * und kein | enthalten');
    }
  }

  const operator = asString(raw.operator ?? 'is', `${path}.operator`, {
    max: 10,
  });

  if (operator !== 'is' && operator !== 'not') {
    fail(`${path}.operator`, 'muss "is" oder "not" sein');
  }

  return { kind, field, operator, value: compared };
}

/**
 * Every block carries the same `Einzug` and the same conditional setting, so both
 * are validated here rather than in each of the nine branches below.
 */
function parseBlock(value: unknown, path: string): NewsletterBlock {
  const raw = asRecord(value, path);
  const block = parseBlockBody(raw, path);
  const condition = asCondition(raw.condition, `${path}.condition`);

  // The closing block is the one block that may not be conditional, and the
  // reason is the publish check: the `*|UNSUB|*` and the address stay in the
  // uploaded HTML whatever the condition says, so `missingRequiredFooterTags`
  // would pass an issue that reaches part of the audience with no way to
  // unsubscribe. The editor offers no condition field on it; this is for a
  // hand-written payload.
  if (condition && block.type === 'footer') {
    fail(
      `${path}.condition`,
      'ist in der Fusszeile nicht möglich — Abmeldelink und Postadresse müssen in jede Ausgabe'
    );
  }

  return {
    ...block,
    gutter: asGutter(raw.gutter, `${path}.gutter`),
    condition,
  };
}

function parseBlockBody(
  raw: Record<string, unknown>,
  path: string
): NewsletterBlock {
  const type = asString(raw.type, `${path}.type`, { max: 50 });

  switch (type) {
    case 'rubric':
      return { type, name: asString(raw.name, `${path}.name`, { max: 100 }) };

    case 'teaser': {
      const variant = asString(raw.variant, `${path}.variant`, { max: 10 });

      if (variant !== 'big' && variant !== 'short') {
        fail(`${path}.variant`, 'muss "big" oder "short" sein');
      }

      return {
        type,
        variant,
        articleId:
          asString(raw.articleId ?? '', `${path}.articleId`, { max: 100 }) ||
          fail(
            `${path}.articleId`,
            'fehlt — bitte im Editor einen Artikel wählen'
          ),
      };
    }

    case 'heading':
      return { type, text: asString(raw.text, `${path}.text`, { max: 300 }) };

    case 'text':
      return {
        type,
        paragraphs: asProseArray(raw.paragraphs, `${path}.paragraphs`),
      };

    case 'image':
      return {
        type,
        imageId: asImageId(raw.imageId, `${path}.imageId`),
        alt: asString(raw.alt ?? '', `${path}.alt`, { max: 300 }),
        href: isBlank(raw.href) ? undefined : asUrl(raw.href, `${path}.href`),
        caption: asOptionalString(raw.caption, `${path}.caption`),
      };

    case 'meta':
      return {
        type,
        left: asString(raw.left ?? '', `${path}.left`, { max: 100 }),
        right: asString(raw.right ?? '', `${path}.right`, { max: 100 }),
      };

    case 'button':
      return {
        type,
        label: asString(raw.label, `${path}.label`, { max: 200 }),
        href: asUrl(raw.href, `${path}.href`),
      };

    case 'panel': {
      const link =
        isBlank(raw.link) ? undefined : asRecord(raw.link, `${path}.link`);

      return {
        type,
        title: asString(raw.title, `${path}.title`, { max: 300 }),
        paragraphs: asProseArray(raw.paragraphs, `${path}.paragraphs`),
        link: link && {
          label: asString(link.label, `${path}.link.label`, { max: 200 }),
          href: asUrl(link.href, `${path}.link.href`),
        },
        imageId: asImageId(raw.imageId, `${path}.imageId`),
      };
    }

    case 'divider':
      return { type };

    // `legal` absent and `legal: []` are different documents: absent means the
    // built-in notice, empty means the editor deleted it. Both are stored as
    // written and `missingRequiredFooterTags` decides whether the second one is
    // publishable — silently restoring the default here would hide the mistake
    // until a subscriber had no way to unsubscribe.
    case 'footer':
      return {
        type,
        title: asString(raw.title ?? '', `${path}.title`, { max: 200 }),
        lines: asProseArray(raw.lines ?? [], `${path}.lines`),
        legal:
          raw.legal === undefined || raw.legal === null ?
            undefined
          : asProseArray(raw.legal, `${path}.legal`),
      };

    default:
      return fail(`${path}.type`, `ist unbekannt ("${type}")`);
  }
}

/** The editor is not allowed to save an issue larger than this many blocks. */
const MAX_BLOCKS = 500;

export function parseDocument(value: unknown): NewsletterDocument {
  const raw = asRecord(value, 'Dokument');
  const blocks = raw.blocks;

  if (!Array.isArray(blocks)) {
    fail('Dokument.blocks', 'muss eine Liste sein');
  }

  if (blocks.length > MAX_BLOCKS) {
    fail('Dokument.blocks', `darf höchstens ${MAX_BLOCKS} Blöcke enthalten`);
  }

  const parsed = blocks.map((block, index) =>
    parseBlock(block, `Block ${index + 1}`)
  );

  // The editor pins the footer block — no drag, duplicate, delete or insert —
  // so a second one cannot come from it. It can come from a hand-written
  // payload, and two closing blocks in a sent issue is worth a refused save.
  if (parsed.filter(block => block.type === 'footer').length > 1) {
    fail('Dokument.blocks', 'darf höchstens eine Fusszeile enthalten');
  }

  return {
    preheader: asString(raw.preheader ?? '', 'Dokument.preheader', {
      max: 300,
    }),
    blocks: parsed,
  };
}
