/** toaster.push(<Message …>body</Message>)  ->  enqueueSnackbar(body, {…}) */
import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);

const matchBalanced = (src, start) => {
  // start points at the '(' of push(
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i++;
        i++;
      }
    }
  }
  return -1;
};

const TAGS = /^<(Message|RMessage|Notification)\b/;

/** Split `<Message …attrs…>body</Message>`, tolerating `>` inside attributes. */
const matchElement = inner => {
  const tag = inner.match(TAGS);
  if (!tag) return null;
  const name = tag[1];

  let i = tag[0].length;
  let depth = 0;
  for (; i < inner.length; i++) {
    const c = inner[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < inner.length && inner[i] !== q) i++;
    } else if (c === '>' && depth === 0) break;
  }
  if (i >= inner.length) return null;

  const attrs = inner.slice(tag[0].length, i);
  const closing = `</${name}>`;
  const end = inner.lastIndexOf(closing);
  if (end === -1) {
    // Self closing: `<Message … />`
    if (attrs.trimEnd().endsWith('/')) {
      return { attrs: attrs.trimEnd().slice(0, -1), body: '', rest: inner.slice(i + 1) };
    }
    return null;
  }
  return {
    attrs,
    body: inner.slice(i + 1, end),
    // Anything after the element is the legacy options argument.
    rest: inner.slice(end + closing.length).replace(/^\s*,\s*/, '').trim(),
  };
};

const parseAttrs = attrStr => {
  const attrs = {};
  const re = /(\w+)(?:=(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|'[^']*'))?/g;
  let m;
  while ((m = re.exec(attrStr))) {
    attrs[m[1]] = m[2] === undefined ? true : m[2];
  }
  return attrs;
};

const unwrap = value => {
  if (typeof value !== 'string') return value;
  if (value.startsWith('{') && value.endsWith('}')) return value.slice(1, -1).trim();
  return value; // keep the quotes for string literals
};

let total = 0;
let skipped = [];

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;
  let changedHere = 0;

  let idx;
  while ((idx = src.indexOf('toaster.push(')) !== -1) {
    const open = idx + 'toaster.push'.length;
    const close = matchBalanced(src, open);
    if (close === -1) break;

    const inner = src.slice(open + 1, close).trim();
    const m = matchElement(inner);
    if (!m) {
      skipped.push(`${file}: ${inner.slice(0, 70).replace(/\s+/g, ' ')}`);
      // Rename so the loop can move past it; fixed up by hand afterwards.
      src = src.slice(0, idx) + 'TOASTER_TODO.push(' + src.slice(open + 1);
      continue;
    }

    const attrs = parseAttrs(m.attrs);
    let body = m.body.trim();

    // A single `{expr}` body is just the expression.
    if (body.startsWith('{') && body.endsWith('}')) {
      const innerBody = body.slice(1, -1);
      let depth = 0,
        ok = true;
      for (const ch of innerBody) {
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth < 0) { ok = false; break; } }
      }
      if (ok && depth === 0) body = innerBody.trim();
    } else if (body.includes('<')) {
      body = `<>${body}</>`;
    } else {
      // Plain text node.
      body = `'${body.replace(/\s+/g, ' ').replace(/'/g, "\\'")}'`;
    }

    const opts = [];
    if (attrs.type) {
      const variant = unwrap(attrs.type);
      if (variant !== "'info'" && variant !== '"info"') {
        opts.push(`variant: ${variant.startsWith('"') ? `'${variant.slice(1, -1)}'` : variant}`);
      }
    }
    // `toaster.push(node, {duration, placement})` — the legacy second argument.
    if (m.rest) {
      const legacyDuration = m.rest.match(/duration\s*:\s*([^,}]+)/);
      if (legacyDuration && attrs.duration === undefined) {
        attrs.duration = `{${legacyDuration[1].trim()}}`;
      }
    }

    const title = attrs.title ?? attrs.header;
    if (title) opts.push(`title: ${unwrap(title)}`);
    if (attrs.duration !== undefined) {
      const d = unwrap(attrs.duration);
      opts.push(`autoHideDuration: ${d === '0' ? 'null' : d}`);
    }

    const call =
      opts.length ?
        `enqueueSnackbar(${body}, {${opts.join(', ')}})`
      : `enqueueSnackbar(${body})`;

    src = src.slice(0, idx) + call + src.slice(close + 1);
    changedHere++;
  }

  src = src.replace(/TOASTER_TODO\.push\(/g, 'toaster.push(');

  if (src !== original) {
    writeFileSync(file, src);
    total += changedHere;
  }
}

console.log(`converted ${total} call sites`);
if (skipped.length) {
  console.log(`\nSKIPPED ${skipped.length}:`);
  skipped.forEach(s => console.log('  ' + s));
}
