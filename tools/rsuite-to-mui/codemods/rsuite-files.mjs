/** List files importing the given names from 'rsuite'. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const wanted = process.argv.slice(2);
const out = [];

const walk = dir => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(entry)) {
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'rsuite';/gs)) {
        const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
        if (wanted.some(w => names.includes(w))) {
          out.push(p);
          break;
        }
      }
    }
  }
};

walk('libs');
walk('apps');
console.log(out.join('\n'));
