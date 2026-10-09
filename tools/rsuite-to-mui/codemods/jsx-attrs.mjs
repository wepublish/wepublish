/**
 * Rewrite JSX attributes in place.
 *
 * Only the attribute span of a matching opening tag is touched, and only via
 * targeted substring edits — the rest of the tag (including arbitrarily nested
 * arrow functions and object literals) is copied through byte for byte.
 *
 * node jsx-attrs.mjs rules.json <file...>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const rules = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const files = process.argv.slice(3);

/** End of the opening tag, skipping strings, template literals and braces. */
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

/** Match `name` or `name="v"` / `name={v}` at the top level of an attr span. */
const attrPattern = name =>
  new RegExp(
    `(^|\\s)${name}(?![\\w$-])(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*'([^']*)'\\s*\\}|\\{\\s*"([^"]*)"\\s*\\}|(\\{(?:[^{}]|\\{[^{}]*\\})*\\})))?`,
    'g'
  );

const valueOf = m => m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[6];

let touched = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (const rule of rules) {
    const open = new RegExp(`<${rule.from}(?=[\\s/>])`, 'g');
    let m;
    const edits = [];

    while ((m = open.exec(src))) {
      const attrsFrom = m.index + m[0].length;
      const end = findTagEnd(src, attrsFrom);
      if (end === -1) continue;

      let span = src.slice(attrsFrom, end);
      const before = span;
      const seen = {};

      // Record current values so `add.when` can test them.
      for (const name of rule.probe ?? []) {
        const re = attrPattern(name);
        const hit = re.exec(span);
        if (hit) seen[name] = valueOf(hit);
      }

      for (const name of rule.drop ?? []) {
        // Consume the whitespace in front of the attribute too, so dropping it
        // does not leave a blank line behind.
        const dropRe = new RegExp(
          `(?:^|\\s+)${name}(?![\\w$-])(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|\\{(?:[^{}]|\\{[^{}]*\\})*\\}))?`,
          'g'
        );
        span = span.replace(dropRe, '');
      }

      for (const [name, to] of Object.entries(rule.rename ?? {})) {
        span = span.replace(attrPattern(name), (full, lead) =>
          full.replace(new RegExp(`(^|\\s)${name}(?![\\w$-])`), `$1${to}`)
        );
      }

      for (const [name, map] of Object.entries(rule.values ?? {})) {
        span = span.replace(attrPattern(name), full => {
          const hit = attrPattern(name).exec(full);
          const v = hit && valueOf(hit);
          if (v === undefined || map[v] === undefined) return full;
          if (map[v] === null) return '';
          return full.replace(
            /=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/,
            `="${map[v]}"`
          );
        });
      }

      let added = null;
      for (const add of rule.add ?? []) {
        const ok = Object.entries(add.when).every(([k, v]) =>
          v === '*' ? seen[k] !== undefined : seen[k] === v
        );
        if (ok) {
          added = add.attrs;
          break;
        }
      }
      if (added === null && rule.defaults !== undefined && !rule.skipDefault?.some(k => seen[k] !== undefined)) {
        added = rule.defaults;
      }

      if (added) {
        // Reuse the exact indentation of the first existing attribute.
        const indent = span.match(/\n([ \t]+)\S/);
        span =
          indent ?
            `\n${indent[1]}${added}${span}`
          : ` ${added}${span}`;
      }

      // Tidy whatever the drops left behind, without touching blank lines
      // inside attribute expressions.
      // Keep the indentation of the final line — that is the indent of the
      // tag's closing `>`, not trailing whitespace.
      const lastNewline = span.lastIndexOf('\n');
      if (lastNewline !== -1) {
        span =
          span.slice(0, lastNewline).replace(/[ \t]+$/gm, '') +
          span.slice(lastNewline);
      }

      if (span !== before) edits.push({ from: attrsFrom, to: end, span });
    }

    for (const edit of edits.reverse()) {
      src = src.slice(0, edit.from) + edit.span + src.slice(edit.to);
    }

    if (rule.to && rule.to !== rule.from) {
      src = src
        .split(`<${rule.from} `).join(`<${rule.to} `)
        .split(`<${rule.from}\n`).join(`<${rule.to}\n`)
        .split(`<${rule.from}>`).join(`<${rule.to}>`)
        .split(`<${rule.from}/>`).join(`<${rule.to}/>`)
        .split(`</${rule.from}>`).join(`</${rule.to}>`);
    }
  }

  if (src !== original) {
    writeFileSync(file, src);
    touched++;
  }
}

console.log(`transformed ${touched} files`);
