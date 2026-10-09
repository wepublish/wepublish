/** Inline <Message|RMessage|Notification …> -> MUI <Alert …> */
import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);
const OPEN = /<(Message|RMessage|Notification)(?=[\s/>])/g;

const tagEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) i++;
    } else if (c === '>' && depth === 0) return i;
  }
  return -1;
};

let changed = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  let guard = 0;
  for (;;) {
    OPEN.lastIndex = 0;
    const m = OPEN.exec(src);
    if (!m || guard++ > 200) break;

    const start = m.index;
    const attrsFrom = start + m[0].length;
    const end = tagEnd(src, attrsFrom);
    if (end === -1) break;

    let attrs = src.slice(attrsFrom, end);
    const selfClosing = attrs.trimEnd().endsWith('/');
    if (selfClosing) attrs = attrs.trimEnd().slice(0, -1);

    // type="error" -> severity="error"
    attrs = attrs.replace(/\btype=/g, 'severity=');
    // showIcon is MUI's default; showIcon={false} -> icon={false}
    attrs = attrs.replace(/\bshowIcon=\{false\}/g, 'icon={false}');
    attrs = attrs.replace(/\bshowIcon\b(?!=)/g, '');
    // An inline alert has nowhere to dismiss to without a handler.
    attrs = attrs.replace(/\bclosable\b(?!=)/g, '');
    // Toast-only prop.
    attrs = attrs.replace(/\bduration=\{[^}]*\}/g, '');
    attrs = attrs.replace(/[ \t]+\n/g, '\n').replace(/\n\s*\n/g, '\n');

    let header = null;
    const headerMatch = attrs.match(
      /\b(?:header|title)=(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|'[^']*')/
    );
    if (headerMatch) {
      header = headerMatch[1];
      attrs = attrs.replace(headerMatch[0], '');
    }

    const closing = `</${m[1]}>`;
    const closeIdx = selfClosing ? -1 : src.indexOf(closing, end);

    let replacement = `<Alert${attrs}${selfClosing ? ' /' : ''}>`;
    if (header && !selfClosing) {
      replacement += `<AlertTitle>${
        header.startsWith('{') ? header : `${header}`
      }</AlertTitle>`;
    }

    src =
      src.slice(0, start) +
      replacement +
      (closeIdx === -1 ?
        src.slice(end + 1)
      : src.slice(end + 1, closeIdx) + '</Alert>' + src.slice(closeIdx + closing.length));
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`rewrote ${changed} files`);
