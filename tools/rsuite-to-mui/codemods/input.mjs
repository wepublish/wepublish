/**
 * rsuite `Input` (and the `InputGroup` + `Addon` sandwich) -> MUI `TextField`.
 *
 *   <InputGroup>
 *     <Input value={filter} onChange={value => setFilter(value)} />
 *     <InputGroup.Addon><MdSearch /></InputGroup.Addon>
 *   </InputGroup>
 *     ->
 *   <TextField
 *     value={filter}
 *     onChange={event => setFilter(event.target.value)}
 *     slotProps={{input: {startAdornment: <InputAdornment …><MdSearch /></…>}}}
 *   />
 *
 * A bare `<Input …/>` becomes a bare `<TextField …/>`.
 *
 * Left alone: anything inside a `Form.Control` (that is `form-control.mjs`'s
 * job), groups with more than one input or a button addon, and file inputs.
 *
 * The `onChange` signature changes from `(value) => …` to `(event) => …`,
 * which TypeScript *can* see, so run `tsc` afterwards.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import {
  findElementEnd,
  findTagEnd,
  parseAttrs,
  rewriteHandler,
  SPREAD,
} from './jsx-utils.mjs';

/** rsuite sizes are t-shirt sizes; MUI has two. */
const SIZES = { lg: 'medium', md: 'medium', sm: 'small', xs: 'small' };

const renderAttrs = (attrs, indent, extra = []) => {
  const lines = [];
  let bailed;

  for (const [name, value] of attrs) {
    if (name === SPREAD) {
      lines.push(`${indent}  ${value}`);
      continue;
    }
    if (name === 'as') continue;
    if (name === 'onChange') {
      const rewritten = rewriteHandler(value);
      if (!rewritten) {
        bailed = 'onChange not a simple arrow';
        break;
      }
      lines.push(`${indent}  onChange=${rewritten}`);
      continue;
    }
    if (name === 'onPressEnter') {
      // No MUI equivalent; the same handler on Enter is the faithful reading.
      // Called with no argument: rsuite passed the event, but these handlers
      // are saves and adds that ignore it, and tsc flags any that do not.
      lines.push(
        `${indent}  onKeyDown={event => {\n` +
          `${indent}    if (event.key === 'Enter') {\n` +
          `${indent}      (${value.slice(1, -1)})();\n` +
          `${indent}    }\n` +
          `${indent}  }}`
      );
      continue;
    }
    if (name === 'size' && value) {
      const size = SIZES[value.replace(/["'{}]/g, '')];
      if (size) {
        lines.push(`${indent}  size="${size}"`);
        continue;
      }
    }
    lines.push(
      value === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${value}`
    );
  }

  return { lines: [...lines, ...extra], bailed };
};

let converted = 0;
let groups = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // --- InputGroup sandwiches first, so the Input inside is consumed with it.
  for (let guard = 0; guard < 50; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<InputGroup(?=[\s>])/g)) {
      if (m.index > last) last = m.index;
    }
    if (last === -1) break;

    const groupEnd = findElementEnd(src, last, 'InputGroup');
    if (groupEnd === -1) break;
    const group = src.slice(last, groupEnd);

    const keep = () => {
      src =
        src.slice(0, last) +
        group.replace(/InputGroup/g, 'InputGroupKEEP') +
        src.slice(groupEnd);
    };

    const inputs = [...group.matchAll(/<Input(?=[\s/>])/g)];
    const addons = [...group.matchAll(/<InputGroup\.Addon(?=[\s>])/g)];

    if (inputs.length !== 1 || addons.length > 1 || /InputGroup\.Button/.test(group)) {
      skipped.push(`${file} (group: ${inputs.length} inputs, ${addons.length} addons)`);
      keep();
      continue;
    }

    const inputStart = inputs[0].index;
    const inputTagEnd = findTagEnd(group, inputStart + '<Input'.length);
    if (inputTagEnd === -1 || group[inputTagEnd - 1] !== '/') {
      skipped.push(`${file} (group: input is not self-closing)`);
      keep();
      continue;
    }

    const attrs = parseAttrs(
      group.slice(inputStart + '<Input'.length, inputTagEnd - 1)
    );
    if (attrs.some(([name]) => name === 'accept' || name === 'type' && /file/.test(String(attrs.find(a => a[0] === 'type')?.[1])))) {
      skipped.push(`${file} (file input)`);
      keep();
      continue;
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';

    // The addon sits after the input in the markup but reads as a leading
    // icon; rsuite rendered it on whichever side it was written.
    const addonBody = addons.length ?
        group
          .slice(addons[0].index)
          .match(/<InputGroup\.Addon[^>]*>([\s\S]*?)<\/InputGroup\.Addon>/)?.[1]
          .trim()
      : undefined;
    const addonFirst = addons.length ? addons[0].index < inputStart : false;

    const extra =
      addonBody ?
        [
          `${indent}  slotProps={{`,
          `${indent}    input: {`,
          `${indent}      ${addonFirst ? 'start' : 'end'}Adornment: (`,
          `${indent}        <InputAdornment position="${addonFirst ? 'start' : 'end'}">`,
          `${indent}          ${addonBody}`,
          `${indent}        </InputAdornment>`,
          `${indent}      ),`,
          `${indent}    },`,
          `${indent}  }}`,
        ]
      : [];

    const { lines, bailed } = renderAttrs(attrs, indent, extra);
    if (bailed) {
      skipped.push(`${file} (group: ${bailed})`);
      keep();
      continue;
    }

    src =
      src.slice(0, last) +
      `<TextField\n${lines.join('\n')}\n${indent}/>` +
      src.slice(groupEnd);
    groups++;
  }

  src = src.replace(/InputGroupKEEP/g, 'InputGroup');

  // --- Then any remaining bare `<Input …/>`.
  for (let guard = 0; guard < 100; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<Input(?=[\s/>])/g)) {
      if (m.index > last) last = m.index;
    }
    if (last === -1) break;

    const tagEnd = findTagEnd(src, last + '<Input'.length);
    if (tagEnd === -1) break;

    const keep = () => {
      src =
        src.slice(0, last) + '<InputKEEP' + src.slice(last + '<Input'.length);
    };

    if (src[tagEnd - 1] !== '/') {
      skipped.push(`${file} (input is not self-closing)`);
      keep();
      continue;
    }

    const attrs = parseAttrs(src.slice(last + '<Input'.length, tagEnd - 1));
    const asValue = attrs.find(([name]) => name === 'as')?.[1];
    const typeValue = attrs.find(([name]) => name === 'type')?.[1];

    if (
      attrs.some(([name]) => name === 'accept') ||
      /file/.test(String(typeValue))
    ) {
      skipped.push(`${file} (file input)`);
      keep();
      continue;
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const extra =
      /textarea/.test(String(asValue)) ? [`${indent}  multiline`] : [];

    const { lines, bailed } = renderAttrs(attrs, indent, extra);
    if (bailed) {
      skipped.push(`${file} (${bailed})`);
      keep();
      continue;
    }

    src =
      src.slice(0, last) +
      `<TextField\n${lines.join('\n')}\n${indent}/>` +
      src.slice(tagEnd + 1);
    converted++;
  }

  src = src.replace(/<InputKEEP/g, '<Input');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${groups} input groups and ${converted} bare inputs`);
if (skipped.length) {
  const counts = {};
  for (const reason of skipped) {
    const key = reason.replace(/^.*\((.*)\)$/, '$1');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  console.log('\nleft alone:');
  for (const [reason, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}  ${reason}`);
  }
}
