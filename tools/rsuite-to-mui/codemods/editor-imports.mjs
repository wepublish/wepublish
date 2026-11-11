/**
 * Import whatever a file now uses from the editor's own UI lib and from
 * react-icons, after the component codemods have run.
 *
 * Inside `libs/ui/editor` these resolve to a relative path; everywhere else to
 * `@wepublish/ui/editor`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const UI_EDITOR = resolve(ROOT, 'libs/ui/editor/src');

/** Exported name -> the module inside libs/ui/editor/src that defines it. */
const EDITOR_EXPORTS = {
  DrawerHeader: 'lib/drawer',
  DrawerTitle: 'lib/drawer',
  DrawerActions: 'lib/drawer',
  DrawerBody: 'lib/drawer',
  DrawerFooter: 'lib/drawer',
  DRAWER_WIDTHS: 'lib/drawer',
  enqueueSnackbar: 'lib/snackbar',
  closeSnackbar: 'lib/snackbar',
  ClickPopover: 'lib/popover',
  Pagination: 'lib/listView/pagination',
  DataTable: 'lib/listView/data-table',
};

/** Icons the codemods introduce on their own. */
const ICONS = { MdExpandMore: 'react-icons/md' };

const moduleFor = (file, subpath) => {
  const abs = resolve(ROOT, file);
  if (!abs.startsWith(UI_EDITOR + '/')) return '@wepublish/ui/editor';
  let rel = relative(dirname(abs), resolve(UI_EDITOR, subpath));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
};

const boundNames = src => {
  const bound = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']+';/gs)) {
    for (const entry of m[1].split(',')) {
      const parts = entry.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
      if (parts[0]) bound.add((parts[1] ?? parts[0]).trim());
    }
  }
  return bound;
};

const addTo = (src, mod, names) => {
  const esc = mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'${esc}';`, 's');
  if (re.test(src)) {
    return src.replace(re, (m, body) => {
      const have = body
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return `import {${[...have, ...names].join(', ')}} from '${mod}';`;
    });
  }
  const lines = src.split('\n');
  let last = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i]) || /^\}\s+from\s+'/.test(lines[i])) last = i;
  }
  lines.splice(last + 1, 0, `import {${names.join(', ')}} from '${mod}';`);
  return lines.join('\n');
};

let changed = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  const bound = boundNames(src);
  /** @type {Record<string, string[]>} */
  const wanted = {};

  for (const [name, subpath] of Object.entries(EDITOR_EXPORTS)) {
    if (bound.has(name)) continue;
    if (!new RegExp(`\\b${name}\\b`).test(src)) continue;
    const mod = moduleFor(file, subpath);
    // A module never imports from itself.
    if (mod.startsWith('.') && resolve(dirname(resolve(ROOT, file)), mod) ===
        resolve(ROOT, file).replace(/\.tsx?$/, '')) continue;
    (wanted[mod] ??= []).push(name);
  }

  for (const [name, mod] of Object.entries(ICONS)) {
    if (bound.has(name)) continue;
    if (!new RegExp(`<${name}(?=[\\s/>])`).test(src)) continue;
    (wanted[mod] ??= []).push(name);
  }

  for (const [mod, names] of Object.entries(wanted)) {
    src = addTo(src, mod, names);
  }

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`added editor imports in ${changed} files`);
