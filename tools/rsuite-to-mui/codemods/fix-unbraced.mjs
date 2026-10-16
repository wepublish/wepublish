/**
 * The icon-button codemod inlined `icon={expr}` as a child verbatim. A single
 * JSX element is fine; any other expression must stay inside braces or React
 * renders it as literal text.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TAGS =
  '(?:IconButton|Button|ToolbarButton|HideToggle|LeftArrow|RightArrow|GridIcon|ToggleButton)';
const re = new RegExp(
  `(<${TAGS}\\b[^>]*>\\n)([ \\t]+)([^\\n<{][^\\n]*)\\n([ \\t]*</${TAGS}>)`,
  'g'
);

let fixed = 0;
for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(re, (full, open, indent, body, close) => {
    const expr = body.trim();
    // Already an expression container or plain translated text? leave alone.
    if (expr.startsWith('{') || /^['"`]/.test(expr)) return full;
    // Only wrap things that look like JS expressions, not prose.
    if (!/[?&|.(]/.test(expr)) return full;
    fixed++;
    return `${open}${indent}{${expr}}\n${close}`;
  });
  if (next !== src) writeFileSync(file, next);
}
console.log(`braced ${fixed} expressions`);
