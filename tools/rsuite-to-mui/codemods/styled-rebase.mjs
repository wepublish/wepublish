/**
 * Rebase local `styled(<rsuite component>)` wrappers onto their MUI
 * equivalent, importing it under a `Mui…` alias so a wrapper named after the
 * component it wraps (`const Panel = styled(RPanel)`) keeps its own name.
 *
 *   node styled-rebase.mjs '{"RPanel":"Card"}' <file...>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const map = JSON.parse(process.argv[2]);
const files = process.argv.slice(3);

/** Local binding names already imported from @mui/material. */
const muiBindings = src => {
  const bound = new Set();
  for (const m of src.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/gs
  )) {
    for (const entry of m[1].split(',')) {
      const parts = entry.trim().split(/\s+as\s+/);
      if (parts[0]) bound.add((parts[1] ?? parts[0]).trim());
    }
  }
  return bound;
};

const addImport = (src, entry) => {
  const re = /import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/s;
  if (re.test(src)) {
    return src.replace(re, (m, body) => {
      const names = body
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return `import {${[...names, entry].join(', ')}} from '@mui/material';`;
    });
  }
  const lines = src.split('\n');
  let last = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i]) || /^\}\s+from\s+'/.test(lines[i])) last = i;
  }
  lines.splice(last + 1, 0, `import {${entry}} from '@mui/material';`);
  return lines.join('\n');
};

let changed = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (const [alias, mui] of Object.entries(map)) {
    // `styled(Radio` must not match `styled(RadioOptionHint` — require the
    // name to end at the paren or a comma.
    const call = new RegExp(`styled\\(${alias}(?=\\s*[,)])`, 'g');
    if (!call.test(src)) continue;
    // Still imported from rsuite? then it is not ours to rebase.
    if (new RegExp(`\\bas\\s+${alias}\\b`).test(src)) continue;

    const local = `Mui${mui}`;
    src = src.replace(
      new RegExp(`styled\\(${alias}(?=\\s*[,)])`, 'g'),
      `styled(${local}`
    );
    if (!muiBindings(src).has(local)) {
      src = addImport(src, `${mui} as ${local}`);
    }
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`rebased ${changed} files`);
