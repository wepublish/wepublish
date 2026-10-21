/**
 * The small amount of formatting a text block is allowed to carry.
 *
 * The intro region of a real issue has links, bold runs and a bullet list, so
 * plain strings are not enough — but accepting HTML from the editor would put
 * arbitrary markup into an email sent to the whole list. The compromise is a
 * tiny markup of three forms, parsed into React elements. Nothing here ever
 * calls `dangerouslySetInnerHTML`, so a stray `<script>` in the editor's text is
 * rendered as the literal characters `<script>` and nothing else.
 *
 *   **fett**                  bold
 *   [Text](https://example)   link
 *   - Zeile                   list item (whole paragraph)
 */
import { Link, Text } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';
import { MERGE_TAG_SOURCE } from './merge-tags';
import { theme } from './theme';

/** Shared with `parse.ts`, which validates the URLs these links carry. */
export const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * A merge tag, `**bold**` and `[label](href)` in one pass, so a bold link and a
 * linked bold run cannot fight over which delimiter is matched first.
 *
 * The merge tag comes first and produces *nothing* — both callers skip that
 * branch and leave the characters in the surrounding run of plain text. It is
 * there only to consume them, because two adjacent tags spell the bold
 * delimiter between them: `*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*`
 * — the footer's own conditional address — reads to the bold branch as
 * `**|LIST:ADDRESSLINE|**`, and the mail would carry a bold row of pipes where
 * the subscriber's postal address belongs. Consuming the tags first is what
 * makes any merge tag safe to type anywhere in a paragraph.
 *
 * A function rather than a constant because the editor's rich-text field parses
 * with it too: a shared `/g` regex carries `lastIndex` between its callers, and
 * one would then start reading in the middle of the other's text. The field
 * parses with *this* pattern so what it shows cannot drift from what the mail
 * draws.
 */
export const inlineMarkup = () =>
  new RegExp(
    `(${MERGE_TAG_SOURCE})|\\*\\*([^*]+)\\*\\*|\\[([^\\]]+)\\]\\(([^)\\s]+)\\)`,
    'g'
  );

/** The footer inverts the palette, so the link colour cannot be a constant. */
export interface ProseOptions {
  linkColor?: string;
}

/**
 * How every link in the newsletter is styled. Every `Link` takes this: the
 * component's own defaults are `#067df7` and no underline, and a link that skips
 * it ships that blue to subscribers — visibly, on the alt text of an image that
 * has not loaded.
 *
 * The decoration is written twice on purpose: Word understands the
 * `text-decoration` shorthand but not `text-decoration-line`, so dropping the
 * shorthand loses the underline in Outlook — and setting the longhand as well
 * replaces the library's value in place instead of leaving a contradicting
 * declaration in the mail.
 */
export function linkStyle(color: string, underline = true): CSSProperties {
  const decoration = underline ? 'underline' : 'none';

  return { color, textDecorationLine: decoration, textDecoration: decoration };
}

/** Splits one run of text into bold, link and plain segments. */
function inline(
  text: string,
  keyPrefix: string,
  options: ProseOptions = {}
): ReactNode[] {
  const style = linkStyle(options.linkColor ?? theme.color.link);

  const nodes: ReactNode[] = [];
  const pattern = inlineMarkup();
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // A merge tag: consumed so the bold branch cannot see the `**` two adjacent
    // tags spell, but emitted as nothing. `last` is left where it was, so the
    // characters ride along in the next slice of plain text.
    if (match[1] !== undefined) {
      continue;
    }

    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (match[2] !== undefined) {
      nodes.push(<strong key={key}>{match[2]}</strong>);
    } else {
      // `Link` already sets `target="_blank"`, and browsers imply `noopener` for
      // it, so neither attribute is written out here.
      nodes.push(
        <Link
          key={key}
          href={match[4]}
          style={style}
        >
          {match[3]}
        </Link>
      );
    }

    last = pattern.lastIndex;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

/**
 * Prose whose lines are separated by a break rather than by paragraph spacing.
 *
 * The footer's legal notice is three lines of one paragraph, not three
 * paragraphs: `renderParagraphs` would put `theme.space.block` between them and
 * the closing block would grow by two lines of air. Returns the children of a
 * single paragraph, so the caller decides which style it carries.
 */
export function renderLines(
  lines: string[],
  options: ProseOptions = {}
): ReactNode[] {
  return lines.flatMap((line, index) => [
    ...(index === 0 ? [] : [<br key={`br-${index}`} />]),
    ...inline(line, `line-${index}`, options),
  ]);
}

/**
 * Renders a block's paragraphs, folding runs of `- ` lines into a single list.
 *
 * Consecutive bullets have to be collected before rendering: emitting one `<ul>`
 * per line would give every bullet its own list, which most clients show with
 * extra vertical space between the items.
 */
export function renderParagraphs(
  paragraphs: string[],
  style: CSSProperties,
  options: ProseOptions = {}
): ReactNode[] {
  const out: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) {
      return;
    }

    // The prose margins go, the list's own shorthand replaces them: a longhand
    // and a shorthand fighting inside one declaration comes down to the order a
    // client's CSS parser happens to apply, and the shorthand is the one that
    // has to win — it zeroes the left margin some clients give a `<ul>`.
    const { marginTop, marginBottom, ...prose } = style;

    out.push(
      // A raw `<ul>`: the component library has no list primitive, and its
      // `Markdown` component would bring a type scale of its own with it.
      <ul
        key={`ul-${out.length}`}
        style={{
          ...prose,
          margin: `${theme.space.block} 0 0 0`,
          paddingLeft: '20px',
        }}
      >
        {bullets.map((item, index) => (
          <li
            key={index}
            style={{ marginBottom: '4px' }}
          >
            {inline(item, `li-${index}`, options)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  paragraphs.forEach((text, index) => {
    if (text.startsWith('- ')) {
      bullets.push(text.slice(2));

      return;
    }

    flushBullets();
    // Both margins are always written: `Text` adds a 16px default for whichever
    // of the two the style leaves undefined, which would space the issue out
    // like a Resend template instead of like the newsletter.
    out.push(
      <Text
        key={`p-${index}`}
        style={{
          ...style,
          marginTop: out.length === 0 ? 0 : theme.space.block,
          marginBottom: 0,
        }}
      >
        {inline(text, `p-${index}`, options)}
      </Text>
    );
  });

  flushBullets();

  return out;
}
