/**
 * Move named imports off 'rsuite' onto another module.
 *
 * usage: node move-imports.mjs '<json spec>' <file...>
 * spec: { "Message": "@wepublish/ui/editor", "toaster": "@wepublish/ui/editor" }
 * A target of "~ui-editor" resolves to a relative path to libs/ui/editor/src
 * when the file lives inside that lib, and to '@wepublish/ui/editor' otherwise.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, dirname, resolve } from 'node:path';

const spec = JSON.parse(process.argv[2]);
const files = process.argv.slice(3);
const ROOT = process.cwd();
const UI_EDITOR = resolve(ROOT, 'libs/ui/editor/src');

const resolveTarget = (target, file) => {
  if (target !== '~ui-editor') return target;
  const abs = resolve(ROOT, file);
  if (!abs.startsWith(UI_EDITOR + '/')) return '@wepublish/ui/editor';
  let rel = relative(dirname(abs), resolve(UI_EDITOR, 'lib/toast'));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
};

const RSUITE_IMPORT =
  /^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'rsuite';?[ \t]*\n/gms;

let changed = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;
  /** @type {Map<string, string[]>} */
  const moved = new Map();

  src = src.replace(RSUITE_IMPORT, (match, typeKw, body) => {
    const parts = body
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    const keep = [];
    for (const part of parts) {
      const name = part.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      const target = spec[name];
      if (!target) {
        keep.push(part);
        continue;
      }
      const mod = resolveTarget(target, file);
      if (!moved.has(mod)) moved.set(mod, []);
      moved.get(mod).push(typeKw ? `type ${part}` : part);
    }
    if (!moved.size) return match;
    if (!keep.length) return '';
    return `import ${typeKw ?? ''}{${keep.join(', ')}} from 'rsuite';\n`;
  });

  if (!moved.size) continue;

  for (const [mod, names] of moved) {
    // Merge into an existing import from the same module when there is one.
    const existing = new RegExp(
      `import\\s+\\{([^}]*)\\}\\s+from\\s+'${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}';`,
      'm'
    );
    if (existing.test(src)) {
      src = src.replace(existing, (m, body) => {
        const all = [...body.split(',').map(p => p.trim()).filter(Boolean), ...names];
        const uniq = [...new Set(all)].sort((a, b) =>
          a.replace(/^type /, '').toLowerCase() < b.replace(/^type /, '').toLowerCase() ? -1 : 1
        );
        return `import {${uniq.join(', ')}} from '${mod}';`;
      });
    } else {
      // Insert after the last import line.
      const lines = src.split('\n');
      let last = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^import\s/.test(lines[i])) last = i;
        if (/^}\s+from\s+'/.test(lines[i])) last = i;
      }
      lines.splice(last + 1, 0, `import {${names.join(', ')}} from '${mod}';`);
      src = lines.join('\n');
    }
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`rewrote ${changed} files`);
