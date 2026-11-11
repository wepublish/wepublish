/**
 * `block` is a rsuite full-width prop that only MUI Buttons don't understand.
 * It was dropped too broadly; put it back on every tag that is still rsuite.
 *
 * Matches tag occurrences positionally between HEAD and the working tree,
 * which is safe because no elements were reordered.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const BUTTONS = new Set([
  'Button', 'IconButton', 'ToolbarButton', 'RIconButton', 'RButton',
  'MuiIconButton', 'LeftArrow', 'RightArrow', 'HideToggle', 'GridIcon',
]);

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

/** All JSX opening tags as {name, attrsFrom, end}, in document order. */
const openTags = src => {
  const out = [];
  for (const m of src.matchAll(/<([A-Z][\w.]*)(?=[\s/>])/g)) {
    const end = findTagEnd(src, m.index + m[0].length);
    if (end === -1) continue;
    out.push({
      name: m[1],
      attrsFrom: m.index + m[0].length,
      end,
      attrs: src.slice(m.index + m[0].length, end),
    });
  }
  return out;
};

let restored = 0;

for (const file of process.argv.slice(2)) {
  const head = execSync(`git show HEAD:${file}`, { encoding: 'utf8', maxBuffer: 64e6 });
  let src = readFileSync(file, 'utf8');

  const headTags = openTags(head);
  const curTags = openTags(src);

  // Index occurrences per tag name so we can line them up.
  const seenHead = {};
  const wantBlock = {};
  for (const t of headTags) {
    const i = (seenHead[t.name] = (seenHead[t.name] ?? -1) + 1);
    if (!BUTTONS.has(t.name) && /(^|\s)block(?![\w$-])\s*(\n|$)/.test(t.attrs)) {
      (wantBlock[t.name] ??= new Set()).add(i);
    }
  }
  if (!Object.keys(wantBlock).length) continue;

  const seenCur = {};
  const edits = [];
  for (const t of curTags) {
    const i = (seenCur[t.name] = (seenCur[t.name] ?? -1) + 1);
    if (!wantBlock[t.name]?.has(i)) continue;
    if (/(^|\s)block(?![\w$-])/.test(t.attrs)) continue;
    const indent = t.attrs.match(/\n([ \t]+)\S/)?.[1] ?? '  ';
    edits.push({ at: t.attrsFrom, text: `\n${indent}block` });
  }

  for (const e of edits.reverse()) {
    src = src.slice(0, e.at) + e.text + src.slice(e.at);
  }

  if (edits.length) {
    writeFileSync(file, src);
    restored += edits.length;
  }
}

console.log(`restored ${restored} block props`);
