/** <DialogTitle><DialogTitle>X</DialogTitle></DialogTitle> -> <DialogTitle>X</DialogTitle> */
import { readFileSync, writeFileSync } from 'node:fs';

let changed = 0;
for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(
    /<DialogTitle>\s*(<DialogTitle>[\s\S]*?<\/DialogTitle>)\s*<\/DialogTitle>/g,
    '$1'
  );
  if (next !== src) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log(`flattened ${changed} files`);
