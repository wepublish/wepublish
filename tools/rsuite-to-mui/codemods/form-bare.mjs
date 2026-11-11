/**
 * The leftovers of the rsuite form: bare `Form.Control`s and the `<Form>`
 * wrappers that carry no `model`.
 *
 *   <Form.Control name="url" value={v} onChange={url => set(url)} />
 *     ->
 *   <TextField value={v} onChange={event => set(event.target.value)} />
 *
 *   <Form onSubmit={() => save()}>   ->  <form onSubmit={…}>
 *   <Form fluid>                     ->  <Stack spacing={3} sx={{ width: '100%' }}>
 *
 * A `<Form>` with no `onSubmit` was never a form — it was the column layout
 * rsuite gave you for free — and keeping it as a `<form>` risks nesting one
 * inside another, which the HTML parser silently drops. So it becomes a Stack.
 *
 * A `<Form>` with a `model` belongs to `form-wrappers.py`; this codemod skips
 * those so the two never fight over the same wrapper.
 *
 * Run AFTER `form-control.mjs` and `form-accepter.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import {
  findElementEnd,
  findTagEnd,
  parseAttrs,
  rewriteHandler,
  SPREAD,
} from './jsx-utils.mjs';

/** rsuite form wiring that a plain `TextField` has no use for. */
const DROPPED = new Set(['name', 'accepter', 'errorMessage', 'checkAsync']);

let controls = 0;
let forms = 0;
let stacks = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // --- bare Form.Control -> TextField -----------------------------------
  for (let guard = 0; guard < 60; guard++) {
    const at = src.search(/<R?Form\.Control(?=[\s/>])/);
    if (at === -1) break;

    const tag = src.slice(at).match(/^<(R?Form\.Control)/)[1];
    const attrsFrom = at + tag.length + 1;
    const tagEnd = findTagEnd(src, attrsFrom);
    if (tagEnd === -1) break;

    const selfClosing = src[tagEnd - 1] === '/';
    const park = () => {
      src = src.slice(0, at) + '<ControlKEEP' + src.slice(attrsFrom);
    };

    if (!selfClosing) {
      skipped.push(`${file} (control with children)`);
      park();
      continue;
    }

    const attrs = parseAttrs(src.slice(attrsFrom, tagEnd - 1));
    if (attrs.some(([name]) => name === 'accepter')) {
      skipped.push(`${file} (accepter left)`);
      park();
      continue;
    }

    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const lines = [];
    let failed = false;
    for (const [name, value] of attrs) {
      if (DROPPED.has(name)) continue;
      if (name === SPREAD) {
        lines.push(`${indent}  ${value}`);
        continue;
      }
      if (name === 'onChange') {
        const rewritten = rewriteHandler(value);
        if (!rewritten) {
          failed = true;
          break;
        }
        lines.push(`${indent}  onChange=${rewritten}`);
        continue;
      }
      if (name === 'rows') {
        lines.push(`${indent}  multiline`);
        lines.push(`${indent}  rows=${value}`);
        continue;
      }
      lines.push(
        value === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${value}`
      );
    }
    if (failed) {
      skipped.push(`${file} (onChange not a simple arrow)`);
      park();
      continue;
    }

    lines.push(`${indent}  fullWidth`);
    src =
      src.slice(0, at) +
      `<TextField\n${lines.join('\n')}\n${indent}/>` +
      src.slice(tagEnd + 1);
    controls++;
  }

  src = src.replace(/<ControlKEEP/g, '<Form.Control');

  // --- the <Form> wrapper -----------------------------------------------
  // A file with a model is `form-wrappers.py`'s to rewrite, wrapper and all.
  const modelled = /Schema\.Model\(/.test(src);
  for (let guard = 0; modelled ? false : guard < 20; guard++) {
    const at = src.search(/<R?Form(?=[\s>])/);
    if (at === -1) break;

    const tag = src.slice(at).match(/^<(R?Form)/)[1];
    const openEnd = findTagEnd(src, at + tag.length + 1);
    const end = findElementEnd(src, at, tag);
    if (openEnd === -1 || end === -1) break;

    const attrs = parseAttrs(src.slice(at + tag.length + 1, openEnd));
    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const onSubmit = attrs.find(([name]) => name === 'onSubmit')?.[1];
    const body = src.slice(openEnd + 1, end - `</${tag}>`.length);

    let open;
    let close;
    if (onSubmit) {
      // rsuite handed `onSubmit` the check result first; with no model there
      // is nothing to check, so the native handler calls straight on — and
      // the `validationPassed &&` guard those handlers open with goes too,
      // since its binding disappears with the parameter.
      const arrow = onSubmit.match(
        /^\{\s*\(?\s*([\w$]*)\s*\)?\s*=>\s*([\s\S]*)\}$/
      );
      const param = arrow?.[1];
      let call = arrow ? arrow[2] : onSubmit.slice(1, -1);
      if (param) {
        call = call.replace(
          new RegExp(`^\\s*${param}\\s*&&\\s*`),
          ''
        );
      }
      open =
        `<form\n${indent}  onSubmit={event => {\n` +
        `${indent}    event.preventDefault();\n` +
        `${indent}    ${call.trim()};\n` +
        `${indent}  }}\n${indent}>`;
      close = '</form>';
      forms++;
    } else {
      // Carry the attributes over — `key` among them, which a `<Form>` inside
      // a `.map()` needs just as much as the Stack that replaces it.
      const kept = attrs
        .filter(([name]) => !['fluid', 'model', 'formValue'].includes(name))
        .map(([name, raw]) =>
          name === SPREAD ? `${indent}  ${raw}`
          : raw === undefined ? `${indent}  ${name}`
          : `${indent}  ${name}=${raw}`
        );
      open =
        `<Stack\n${kept.join('\n')}${kept.length ? '\n' : ''}` +
        `${indent}  spacing={3}\n${indent}  sx={{ width: '100%' }}\n${indent}>`;
      close = '</Stack>';
      stacks++;
    }

    src = src.slice(0, at) + open + body + indent + close + src.slice(end);
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(
  `converted ${controls} controls, ${forms} forms, ${stacks} layout stacks`
);
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
