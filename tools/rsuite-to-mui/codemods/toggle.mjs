/**
 * rsuite `Toggle` -> MUI `Switch`.
 *
 * The trap is the handler signature: rsuite calls `onChange(checked, event)`,
 * MUI calls `onChange(event, checked)`. The arguments are swapped, so a plain
 * rename would silently hand every handler an event object where it expects a
 * boolean.
 *
 * `label` becomes a wrapping `FormControlLabel`, and `defaultChecked` is
 * dropped whenever `checked` is also present (React warns about inputs that
 * are both controlled and uncontrolled).
 */
import { readFileSync, writeFileSync } from 'node:fs';

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

const braceEnd = (src, from) => {
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

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  const edits = [];
  for (const m of src.matchAll(/<Toggle(?=[\s/>])/g)) {
    const from = m.index + m[0].length;
    const end = findTagEnd(src, from);
    if (end === -1) continue;

    let span = src.slice(from, end);
    const selfClosing = span.trimEnd().endsWith('/');
    if (selfClosing) span = span.trimEnd().slice(0, -1);

    // Swap the handler arguments.
    const onChangeAt = span.search(/(^|\s)onChange\s*=\s*\{/);
    if (onChangeAt !== -1) {
      const open = span.indexOf('{', onChangeAt);
      const close = braceEnd(span, open);
      const handler = span.slice(open + 1, close).trim();

      let rewritten;
      const arrow = handler.match(/^\(?\s*([A-Za-z_$][\w$]*)(\s*:\s*[^),]+)?\s*\)?\s*=>/);
      if (arrow) {
        // `checked => …` / `(checked: boolean) => …`
        rewritten = handler.replace(
          /^\(?\s*[A-Za-z_$][\w$]*(\s*:\s*[^),]+)?\s*\)?\s*=>/,
          `(_event, ${arrow[1]}${arrow[2] ?? ''}) =>`
        );
      } else if (/^[A-Za-z_$][\w$.]*$/.test(handler)) {
        // a bare function reference
        rewritten = `(_event, checked) => ${handler}(checked)`;
      } else {
        rewritten = handler;
      }

      span = span.slice(0, open + 1) + rewritten + span.slice(close);
    }

    // Controlled wins over uncontrolled.
    if (/(^|\s)checked\s*=/.test(span)) {
      span = span.replace(
        /(^|\s)defaultChecked\s*=\s*(?:"[^"]*"|\{(?:[^{}]|\{[^{}]*\})*\})/,
        ''
      );
    }

    // `label` has no MUI Switch equivalent; it wraps instead.
    let label = null;
    const labelHit = span.match(
      /(^|\s)label\s*=\s*(?:"([^"]*)"|\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\})/
    );
    if (labelHit) {
      label = labelHit[2] !== undefined ? `"${labelHit[2]}"` : `{${labelHit[3]}}`;
      span = span.replace(labelHit[0], '');
    }

    const baseIndent = src.slice(0, m.index).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const tagEnd = selfClosing ? end + 1 : src.indexOf('</Toggle>', end) + '</Toggle>'.length;

    const cleaned = span
      .split('\n')
      .filter((line, i) => i === 0 || line.trim().length || line === span.split('\n').at(-1))
      .join('\n');

    let replacement = `<Switch${cleaned}/>`;
    if (label) {
      replacement =
        `<FormControlLabel\n${baseIndent}  control={<Switch${cleaned}/>}\n` +
        `${baseIndent}  label=${label}\n${baseIndent}/>`;
    }

    edits.push({ from: m.index, to: tagEnd, replacement });
  }

  for (const e of edits.reverse()) {
    src = src.slice(0, e.from) + e.replacement + src.slice(e.to);
    converted++;
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} toggles`);
