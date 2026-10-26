/**
 * Shared JSX surgery for the rsuite codemods.
 *
 * These edit substrings *inside* a tag rather than re-serialising it. An early
 * version of this migration used a JSX transform that round-tripped the tree,
 * which destroyed every file whose props contained nested arrow functions.
 */

/** Finds the matching `>` of a JSX opening tag, skipping braces and strings. */
export const findTagEnd = (src, from) => {
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

/**
 * Finds the end of `<Tag …>…</Tag>`, honouring nesting of the same tag.
 *
 * The tag name has to end where it ends: searching for the bare prefix makes
 * `<InputGroup.Addon>` look like a nested `<InputGroup>`, and the depth count
 * never comes back to zero.
 */
export const findElementEnd = (src, startIdx, tag) => {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const opensHere = i =>
    src.startsWith(open, i) && /[\s/>]/.test(src[i + open.length] ?? '');
  let depth = 0;
  let i = startIdx;

  while (i < src.length) {
    let nextOpen = -1;
    for (let j = i; j < src.length; j++) {
      if (opensHere(j)) {
        nextOpen = j;
        break;
      }
    }
    const nextClose = src.indexOf(close, i);
    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      const tagEnd = findTagEnd(src, nextOpen + open.length);
      if (tagEnd === -1) return -1;
      // self-closing tags never get a matching close
      if (src[tagEnd - 1] !== '/') depth++;
      i = tagEnd + 1;
      continue;
    }

    depth--;
    if (depth === 0) return nextClose + close.length;
    i = nextClose + close.length;
  }
  return -1;
};

/** Marks a `{...spread}` entry, which has no name of its own. */
export const SPREAD = Symbol('spread');

/** Splits a JSX attribute span into `[name, rawValue]` pairs, in order. */
export const parseAttrs = span => {
  const attrs = [];
  let i = 0;

  while (i < span.length) {
    while (i < span.length && /[\s/]/.test(span[i])) i++;
    if (i >= span.length) break;

    // `{...props}` is one attribute, not a name called `props`. Capture it
    // whole so it can be written straight back out.
    if (span.startsWith('{...', i)) {
      const start = i;
      let d = 0;
      for (; i < span.length; i++) {
        if (span[i] === '{') d++;
        else if (span[i] === '}' && --d === 0) {
          i++;
          break;
        }
      }
      attrs.push([SPREAD, span.slice(start, i)]);
      continue;
    }

    const nameStart = i;
    while (i < span.length && /[\w$-]/.test(span[i])) i++;
    const name = span.slice(nameStart, i);
    if (!name) {
      i++;
      continue;
    }

    while (i < span.length && /\s/.test(span[i])) i++;
    if (span[i] !== '=') {
      attrs.push([name, undefined]);
      continue;
    }
    i++;
    while (i < span.length && /\s/.test(span[i])) i++;

    if (span[i] === '"' || span[i] === "'") {
      const q = span[i];
      const start = i;
      i++;
      while (i < span.length && span[i] !== q) i++;
      i++;
      attrs.push([name, span.slice(start, i)]);
    } else if (span[i] === '{') {
      const start = i;
      let d = 0;
      for (; i < span.length; i++) {
        if (span[i] === '{') d++;
        else if (span[i] === '}' && --d === 0) {
          i++;
          break;
        }
      }
      attrs.push([name, span.slice(start, i)]);
    } else {
      i++;
    }
  }
  return attrs;
};

/**
 * rsuite hands a change handler the *value*; MUI hands it the *event*.
 *
 *   `{(code: string) => f(code)}` -> `{event => f(event.target.value)}`
 *
 * Returns undefined when the handler is not a single-parameter arrow, so the
 * caller can leave it alone rather than guess.
 */
export const rewriteHandler = raw => {
  if (!raw?.startsWith('{')) return undefined;
  const inner = raw.slice(1, -1).trim();

  // `onChange={setValue}` — the setter straight through, which only works
  // while the handler is handed the value rather than the event.
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(inner)) {
    return `{event => ${inner}(event.target.value)}`;
  }

  const match = inner.match(
    /^\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*([\s\S]*)$/
  );
  if (!match) return undefined;

  const [, param] = match;
  let body = match[2];

  // Already an event handler — a previous pass, or a native input that was
  // never rsuite's. Rewriting it again yields `event.target.value.target.value`.
  if (new RegExp(`(?<![\\w$.])${param}\\s*\\.\\s*target`).test(body)) {
    return raw;
  }

  // Which bracket each offset sits directly inside. A comma only introduces
  // an object shorthand when the innermost open bracket is `{` — in
  // `f(id, value, type)` the same comma separates call arguments, and reading
  // it as shorthand turns the call into a syntax error.
  const enclosing = new Array(body.length).fill('');
  const stack = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === ')' || c === ']' || c === '}') stack.pop();
    enclosing[i] = stack.at(-1) ?? '';
    if (c === '(' || c === '[' || c === '{') stack.push(c);
  }

  // `{ code }` is shorthand for `{ code: code }`; only the value half may be
  // rewritten, so expand it before rewriting anything.
  const word = new RegExp(`(?<![\\w$.])${param}(?![\\w$])`, 'g');
  body = body.replace(word, (whole, offset) => {
    if (enclosing[offset] !== '{') return whole;
    const before = body.slice(0, offset).replace(/\s+$/, '');
    const after = body.slice(offset + whole.length).replace(/^\s+/, '');
    const isShorthand =
      /[{,]$/.test(before) && (after.startsWith(',') || after.startsWith('}'));
    return isShorthand ? `${param}: ${param}` : whole;
  });

  // Whole-word replacement, skipping object keys (`param:` directly after a
  // `{` or `,`). A shadowed binding of the same name would still be rewritten,
  // which is why the result goes through tsc.
  const rewritten = body.replace(word, (whole, offset) => {
    const before = body.slice(0, offset).replace(/\s+$/, '');
    const after = body.slice(offset + whole.length).replace(/^\s+/, '');
    const isKey = after.startsWith(':') && /[{,]$/.test(before);
    return isKey ? whole : 'event.target.value';
  });
  return `{event => ${rewritten}}`;
};
