/**
 * `<Link to="…"><Button/></Link>` -> `<Button component={RouterLink} to="…"/>`
 *
 * A router link wrapped round a button renders an anchor round a button: two
 * focusable things for one action, and the anchor carries the browser's own
 * link styling. MUI's answer is `component`, which makes the button itself the
 * anchor.
 *
 * Only the unambiguous case is rewritten: a link whose props are all
 * navigation props, holding nothing but one button. Anything else — a link
 * with a `className`, a link round several things — is left for a human.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findElementEnd, findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

/** Props that belong to the navigation rather than to the look of the link. */
const NAV_PROPS = new Set([
  'to',
  'replace',
  'state',
  'reloadDocument',
  'target',
  'rel',
  'title',
]);

let moved = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 40; guard++) {
    const match = [...src.matchAll(/<(Link|RouterLink)(?=[\s>])/g)].at(-1);
    if (!match) break;

    const tag = match[1];
    const start = match.index;
    const end = findElementEnd(src, start, tag);
    if (end === -1) break;

    const openEnd = findTagEnd(src, start + tag.length + 1);
    const attrs = parseAttrs(src.slice(start + tag.length + 1, openEnd));
    const body = src.slice(openEnd + 1, end - `</${tag}>`.length).trim();

    const buttonMatch = body.match(/^<(Button|IconButton)(?=[\s/>])/);
    const closesCleanly =
      buttonMatch &&
      (body.endsWith(`</${buttonMatch[1]}>`) || body.endsWith('/>')) &&
      findElementEnd(body, 0, buttonMatch[1]) === body.length;

    const navOnly = attrs.every(([name]) => name !== SPREAD && NAV_PROPS.has(name));

    if (!closesCleanly || !navOnly) {
      // Renamed so the next pass walks past it, and put back at the end.
      skipped.push({ file, why: !closesCleanly ? 'not a lone button' : 'styled link' });
      src =
        src.slice(0, start) +
        src.slice(start, end).replaceAll(tag, `KEEP${tag}`) +
        src.slice(end);
      continue;
    }

    const indent = src.slice(0, start).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const buttonTag = buttonMatch[1];
    const buttonOpenEnd = findTagEnd(body, buttonTag.length + 1);
    const selfClosing = body[buttonOpenEnd - 1] === '/';
    const buttonAttrs = parseAttrs(
      body.slice(buttonTag.length + 1, selfClosing ? buttonOpenEnd - 1 : buttonOpenEnd)
    );

    const render = ([name, value]) =>
      `\n${indent}  ${name === SPREAD ? value : name}${
        name === SPREAD || value === undefined ? '' : `=${value}`
      }`;

    const props =
      `\n${indent}  component={RouterLink}` +
      attrs.map(render).join('') +
      buttonAttrs.map(render).join('');

    const children = selfClosing ? null : (
      body
        .slice(buttonOpenEnd + 1, body.length - `</${buttonTag}>`.length)
        .trim()
    );

    const rewritten =
      `<${buttonTag}${props}\n${indent}` +
      (children === null ?
        '/>'
      : `>\n${indent}  ${children}\n${indent}</${buttonTag}>`);

    src = src.slice(0, start) + rewritten + src.slice(end);
    moved++;
  }

  src = src.replaceAll('KEEPLink', 'Link').replaceAll('KEEPRouterLink', 'RouterLink');

  if (src !== original) writeFileSync(file, src);
}

console.log(`moved ${moved} links onto their button`);
if (skipped.length) {
  const counts = {};
  for (const { why } of skipped) counts[why] = (counts[why] ?? 0) + 1;
  console.log('left alone:');
  for (const [why, n] of Object.entries(counts)) console.log(`  ${n}  ${why}`);
}
