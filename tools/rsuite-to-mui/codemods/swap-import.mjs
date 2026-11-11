/**
 * Drop names from the 'rsuite' import and add the MUI components a file now
 * uses (detected from its JSX), merging into any existing @mui/material import.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const drop = new Set(JSON.parse(process.argv[2]));
const candidates = JSON.parse(process.argv[3]);
const files = process.argv.slice(4);

let changed = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(
    /^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'rsuite';[ \t]*\n/gms,
    (match, typeKw, body) => {
      const keep = body
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .filter(p => !drop.has(p.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()));
      if (keep.length === body.split(',').map(s => s.trim()).filter(Boolean).length)
        return match;
      return keep.length ? `import ${typeKw ?? ''}{${keep.join(', ')}} from 'rsuite';\n` : '';
    }
  );

  // Local binding names already in scope from @mui/material. `Stack as
  // MuiStack` binds `MuiStack`, NOT `Stack` — comparing against the raw text
  // would wrongly consider `Stack` already imported.
  const bound = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/gs)) {
    for (const entry of m[1].split(',')) {
      const parts = entry.trim().split(/\s+as\s+/);
      if (parts[0]) bound.add((parts[1] ?? parts[0]).trim());
    }
  }

  const needed = candidates.filter(
    name => new RegExp(`<${name}(?=[\\s/>])`).test(src) && !bound.has(name)
  );

  if (needed.length) {
    const re = /import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/s;
    if (re.test(src)) {
      src = src.replace(re, (m, body) => {
        const all = [...body.split(',').map(s => s.trim()).filter(Boolean), ...needed];
        return `import {${[...new Set(all)].join(', ')}} from '@mui/material';`;
      });
    } else {
      const lines = src.split('\n');
      let last = 0;
      for (let i = 0; i < lines.length; i++)
        if (/^import\s/.test(lines[i]) || /^\}\s+from\s+'/.test(lines[i])) last = i;
      lines.splice(last + 1, 0, `import {${needed.join(', ')}} from '@mui/material';`);
      src = lines.join('\n');
    }
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`swapped imports in ${changed} files`);
