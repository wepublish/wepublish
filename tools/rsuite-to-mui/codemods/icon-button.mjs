/**
 * rsuite  <IconButton icon={<X/>} />            -> MUI <IconButton><X/></IconButton>
 * rsuite  <IconButton icon={<X/>}>Label</…>     -> MUI <Button startIcon={<X/>}>Label</Button>
 *
 * Takes the tag names to convert (the rsuite import, its aliases and any local
 * styled() wrappers over it).
 */
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Tags whose name must survive the rewrite because they are local styled()
 * wrappers carrying layout CSS; everything else becomes a plain MUI IconButton.
 */
const tags = JSON.parse(process.argv[2]);
const keepName = new Set(JSON.parse(process.argv[3] ?? '[]'));
const files = process.argv.slice(4);

const findTagEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (c === '>' && depth === 0) return i;
  }
  return -1;
};

/** Balanced `{ … }` starting at `from` (which points at `{`). */
const braceSpan = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    }
  }
  return -1;
};

const APPEARANCE = {
  primary: 'variant="contained"',
  ghost: 'variant="outlined"',
  subtle: 'variant="text"',
  link: 'variant="text"',
  default: 'variant="outlined"',
};
const SIZES = { xs: 'small', sm: 'small', md: 'medium', lg: 'large' };
const COLORS = {
  red: 'error',
  green: 'success',
  blue: 'primary',
  yellow: 'warning',
  orange: 'warning',
  cyan: 'info',
  violet: 'secondary',
};

let total = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (const tag of tags) {
    let searchFrom = 0;
    for (;;) {
      const open = new RegExp(`<${tag}(?=[\\s/>])`, 'g');
      open.lastIndex = searchFrom;
      const m = open.exec(src);
      if (!m) break;

      const start = m.index;
      const attrsFrom = start + m[0].length;
      const end = findTagEnd(src, attrsFrom);
      if (end === -1) break;

      let attrs = src.slice(attrsFrom, end);
      const selfClosing = attrs.trimEnd().endsWith('/');
      if (selfClosing) attrs = attrs.trimEnd().slice(0, -1);

      // Pull the icon out.
      const iconAt = attrs.search(/(^|\s)icon\s*=\s*\{/);
      let icon = null;
      if (iconAt !== -1) {
        const braceAt = attrs.indexOf('{', iconAt);
        const braceEnd = braceSpan(attrs, braceAt);
        icon = attrs.slice(braceAt + 1, braceEnd).trim();
        attrs = attrs.slice(0, iconAt) + attrs.slice(braceEnd + 1);
      }

      if (!icon) {
        searchFrom = end + 1;
        continue;
      }

      // Does it have text children?
      let hasChildren = false;
      let closeStart = -1;
      let closeEnd = -1;
      if (!selfClosing) {
        const closing = `</${tag}>`;
        closeStart = src.indexOf(closing, end);
        closeEnd = closeStart + closing.length;
        hasChildren = src.slice(end + 1, closeStart).trim().length > 0;
      }

      // Map the remaining rsuite props.
      let appearance = null;
      attrs = attrs.replace(
        /(^|\s)appearance\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"]([^'"]*)['"]\s*\})/,
        (full, lead, a, b, c) => {
          appearance = a ?? b ?? c;
          return '';
        }
      );
      attrs = attrs.replace(/(^|\s)circle(?![\w$-])/g, '');
      attrs = attrs.replace(
        /(^|\s)size\s*=\s*"(\w+)"/,
        (full, lead, v) => (SIZES[v] ? `${lead}size="${SIZES[v]}"` : full)
      );
      attrs = attrs.replace(
        /(^|\s)color\s*=\s*"(\w+)"/,
        (full, lead, v) => (COLORS[v] ? `${lead}color="${COLORS[v]}"` : full)
      );

      // Dropping attributes leaves blank lines behind; rebuild the span from
      // its surviving lines so the result stays readable.
      const baseIndent = src.slice(0, start).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
      const indent = baseIndent + '  ';

      const normalize = span => {
        if (!span.includes('\n')) {
          const one = span.replace(/\s+/g, ' ').trimEnd();
          return one === '' ? '' : one;
        }
        const lines = span.split('\n');
        const tail = lines.pop();
        const head = lines.shift() ?? '';
        const kept = lines.filter(l => l.trim().length);
        let out = head.trim() ? head.trimEnd() : '';
        for (const line of kept) out += '\n' + line;
        return out + '\n' + tail;
      };
      attrs = normalize(attrs);

      const multiline = attrs.includes('\n');
      const prepend = extra => (extra ? `\n${indent}${extra}` : '');

      let replacement;
      if (hasChildren) {
        // Icon + label reads as a MUI Button with a start icon.
        const variant = APPEARANCE[appearance] ?? 'variant="outlined"';
        const body = src.slice(end + 1, closeStart);
        replacement =
          `<Button${prepend(variant)}${prepend(`startIcon={${icon}}`)}${attrs}>` +
          body +
          `</Button>`;
        src = src.slice(0, start) + replacement + src.slice(closeEnd);
      } else {
        // Icon only: MUI IconButton takes the icon as its child.
        const inner =
          multiline ? `\n${indent}${icon}\n${baseIndent}` : icon;
        const outTag = keepName.has(tag) ? tag : 'IconButton';
        replacement = `<${outTag}${attrs}>${inner}</${outTag}>`;
        src =
          src.slice(0, start) +
          replacement +
          src.slice(selfClosing ? end + 1 : closeEnd);
      }

      total++;
      searchFrom = start + replacement.length;
    }
  }

  if (src !== original) {
    writeFileSync(file, src);
  }
}

console.log(`converted ${total} icon buttons`);
