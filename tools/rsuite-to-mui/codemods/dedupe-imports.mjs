/**
 * The codemods can add a name to the @mui/material import that the file
 * already gets from @wepublish/ui/editor (or declares locally). Keep the
 * existing one and drop the duplicate from @mui/material.
 */
import { readFileSync, writeFileSync } from 'node:fs';

let changed = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  const muiMatch = src.match(/import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/s);
  if (!muiMatch) continue;

  const muiNames = muiMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  const rest = src.replace(muiMatch[0], '');

  const kept = muiNames.filter(entry => {
    const local = (entry.split(/\s+as\s+/)[1] ?? entry).trim();
    const importedElsewhere = new RegExp(
      `import\\s*\\{[^}]*\\b${local}\\b[^}]*\\}\\s*from\\s*'(?!@mui/material)[^']+'`,
      's'
    ).test(rest);
    const declaredLocally = new RegExp(
      `^(?:const|let|function|class)\\s+${local}\\b`,
      'm'
    ).test(rest);
    return !importedElsewhere && !declaredLocally;
  });

  if (kept.length !== muiNames.length) {
    src = src.replace(
      muiMatch[0],
      kept.length ? `import {${kept.join(', ')}} from '@mui/material';` : ''
    );
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`deduped ${changed} files`);
