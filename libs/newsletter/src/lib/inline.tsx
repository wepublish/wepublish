import { Link, Text } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';
import { MERGE_TAG_SOURCE } from './merge-tags';
import { theme } from './theme';

/**
 * The formatting a text block may carry, parsed into React elements so no
 * markup from the editor ever reaches the mail:
 *
 *   **bold**                  bold
 *   [Text](https://example)   link
 *   - line                    list item (whole paragraph)
 */

export const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Merge tags are matched first and emit nothing: two adjacent tags spell the
 * bold delimiter between them (`*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*`).
 * A function rather than a constant because a shared `/g` regex carries
 * `lastIndex` between callers.
 */
export const inlineMarkup = () =>
  new RegExp(
    `(${MERGE_TAG_SOURCE})|\\*\\*([^*]+)\\*\\*|\\[([^\\]]+)\\]\\(([^)\\s]+)\\)`,
    'g'
  );

export interface ProseOptions {
  linkColor?: string;
}

/**
 * Written twice on purpose: Word understands the `text-decoration` shorthand
 * but not `text-decoration-line`, which is what the component sets.
 */
export function linkStyle(color: string, underline = true): CSSProperties {
  const decoration = underline ? 'underline' : 'none';

  return { color, textDecorationLine: decoration, textDecoration: decoration };
}

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

/** Lines of one paragraph separated by `<br>`, for the footer's legal notice. */
export function renderLines(
  lines: string[],
  options: ProseOptions = {}
): ReactNode[] {
  return lines.flatMap((line, index) => [
    ...(index === 0 ? [] : [<br key={`br-${index}`} />]),
    ...inline(line, `line-${index}`, options),
  ]);
}

/** Paragraphs, with runs of `- ` lines folded into a single list. */
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

    const { marginTop, marginBottom, ...prose } = style;

    out.push(
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
    // Both margins always written: `Text` substitutes 16px for a missing one.
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
