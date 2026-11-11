/**
 * rsuite `Nav appearance="tabs"` -> MUI `Tabs` + `Tab`.
 *
 *   <Nav activeKey={k} onSelect={k => set(k)}>
 *     <Nav.Item eventKey="a" icon={<I />}>Label</Nav.Item>
 *   </Nav>
 *     ->
 *   <Tabs value={k} onChange={(_event, k) => set(k)}>
 *     <Tab value="a" icon={<I />} iconPosition="start" label={<>Label</>} />
 *   </Tabs>
 *
 * rsuite hands `onSelect` the key; MUI hands `onChange` the event first, so
 * the handler is rewritten the same way the input codemods do it.
 *
 * A `Nav` whose items have `onClick` instead of `eventKey` is NOT a tab bar —
 * it is a row of buttons — and is left alone.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findElementEnd, findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

/** `{k => set(k)}` -> `{(_event, k) => set(k)}` */
const rewriteSelect = raw => {
  if (!raw?.startsWith('{')) return undefined;
  const inner = raw.slice(1, -1).trim();
  const match = inner.match(
    /^\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*([\s\S]*)$/
  );
  if (!match) return undefined;
  return `{(_event, ${match[1]}) => ${match[2]}}`;
};

let tabs = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 20; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<R?Nav(?=[\s>])/g)) {
      if (m.index > last) last = m.index;
    }
    if (last === -1) break;

    const tag = src.slice(last).match(/^<(R?Nav)/)[1];
    const end = findElementEnd(src, last, tag);
    if (end === -1) break;
    const nav = src.slice(last, end);

    const keep = () => {
      src =
        src.slice(0, last) +
        nav.replace(new RegExp(tag, 'g'), 'NavKEEP') +
        src.slice(end);
    };

    if (!/eventKey=/.test(nav)) {
      // A row of buttons, not a tab bar.
      skipped.push(`${file} (no eventKey)`);
      keep();
      continue;
    }

    const openEnd = findTagEnd(src, last + tag.length + 1);
    const navAttrs = parseAttrs(src.slice(last + tag.length + 1, openEnd));
    const activeKey = navAttrs.find(([n]) => n === 'activeKey')?.[1];
    const onSelect = navAttrs.find(([n]) => n === 'onSelect')?.[1];
    const onChange = onSelect ? rewriteSelect(onSelect) : undefined;
    if (onSelect && !onChange) {
      skipped.push(`${file} (onSelect not a simple arrow)`);
      keep();
      continue;
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    let body = src.slice(openEnd + 1, end - `</${tag}>`.length);

    // <Nav.Item …>children</Nav.Item> -> <Tab … label={<>children</>} />
    // Scanned rather than matched: a regex `>` lands inside `icon={<I />}`.
    for (let inner = 0; inner < 50; inner++) {
      const at = body.search(/<R?Nav\.Item(?=[\s/>])/);
      if (at === -1) break;

      const itemTag = body.slice(at).match(/^<(R?Nav\.Item)/)[1];
      const attrsFrom = at + itemTag.length + 1;
      const tagEnd = findTagEnd(body, attrsFrom);
      if (tagEnd === -1) break;

      const selfClosing = body[tagEnd - 1] === '/';
      const closeTag = `</${itemTag}>`;
      const itemEnd =
        selfClosing ? tagEnd + 1 : body.indexOf(closeTag, tagEnd) + closeTag.length;
      const children =
        selfClosing ? '' : body.slice(tagEnd + 1, itemEnd - closeTag.length).trim();

      const attrs = parseAttrs(
        body.slice(attrsFrom, selfClosing ? tagEnd - 1 : tagEnd)
      );
      const itemIndent =
        body.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? indent + '  ';

      const lines = [];
      let hasIcon = false;
      for (const [name, value] of attrs) {
        if (name === SPREAD) {
          lines.push(`${itemIndent}  ${value}`);
          continue;
        }
        if (name === 'eventKey') {
          lines.push(`${itemIndent}  value=${value}`);
          continue;
        }
        if (name === 'icon') hasIcon = true;
        lines.push(
          value === undefined ?
            `${itemIndent}  ${name}`
          : `${itemIndent}  ${name}=${value}`
        );
      }
      if (hasIcon) lines.push(`${itemIndent}  iconPosition="start"`);
      if (children) {
        lines.push(`${itemIndent}  label={<>${children}</>}`);
      }

      body =
        body.slice(0, at) +
        `<Tab\n${lines.join('\n')}\n${itemIndent}/>` +
        body.slice(itemEnd);
    }

    const navLines = [];
    if (activeKey) navLines.push(`${indent}  value=${activeKey}`);
    if (onChange) navLines.push(`${indent}  onChange=${onChange}`);
    for (const [name, value] of navAttrs) {
      if (['activeKey', 'onSelect', 'appearance', 'justified'].includes(name)) {
        continue;
      }
      if (name === SPREAD) {
        navLines.push(`${indent}  ${value}`);
        continue;
      }
      navLines.push(
        value === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${value}`
      );
    }

    src =
      src.slice(0, last) +
      `<Tabs\n${navLines.join('\n')}\n${indent}>${body}${indent}</Tabs>` +
      src.slice(end);
    tabs++;
  }

  src = src.replace(/NavKEEP/g, 'Nav');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${tabs} tab bars`);
if (skipped.length) {
  const counts = {};
  for (const reason of skipped) {
    const key = reason.replace(/^.*\((.*)\)$/, '$1');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  console.log('\nleft alone:');
  for (const [reason, count] of Object.entries(counts)) {
    console.log(`  ${count}  ${reason}`);
  }
}
