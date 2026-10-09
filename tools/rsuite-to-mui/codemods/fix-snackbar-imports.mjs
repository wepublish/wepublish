/**
 * After the toaster/Message codemods: drop the dead Message/toaster/Notification
 * imports and add whatever the file now actually uses
 * (enqueueSnackbar from the editor lib, Alert/AlertTitle from MUI).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const UI_EDITOR = resolve(ROOT, 'libs/ui/editor/src');
const DEAD = new Set(['Message', 'RMessage', 'toaster', 'Notification']);

const snackbarModule = file => {
  const abs = resolve(ROOT, file);
  if (!abs.startsWith(UI_EDITOR + '/')) return '@wepublish/ui/editor';
  let rel = relative(dirname(abs), resolve(UI_EDITOR, 'lib/snackbar'));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
};

const stripDead = (body, removed) =>
  body
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .filter(p => {
      const name = p.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      const alias = p.split(/\s+as\s+/)[1]?.trim() ?? name;
      if (DEAD.has(name) || DEAD.has(alias)) {
        removed.add(alias);
        return false;
      }
      return true;
    });

const addToImport = (src, mod, names) => {
  const esc = mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+'${esc}';`, 'm');
  if (re.test(src)) {
    return src.replace(re, (m, body) => {
      const all = [
        ...body.split(',').map(p => p.trim()).filter(Boolean),
        ...names.filter(n => !new RegExp(`\\b${n}\\b`).test(body)),
      ];
      return `import {${[...new Set(all)].join(', ')}} from '${mod}';`;
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
  const removed = new Set();

  src = src.replace(
    /^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)';[ \t]*\n/gms,
    (match, typeKw, body, mod) => {
      if (!/rsuite|@wepublish\/ui\/editor|\.\.?\/.*toast/.test(mod)) return match;
      const before = body;
      const keep = stripDead(body, removed);
      if (keep.join(',') === before.split(',').map(p => p.trim()).filter(Boolean).join(','))
        return match;
      if (!keep.length) return '';
      return `import ${typeKw ?? ''}{${keep.join(', ')}} from '${mod}';\n`;
    }
  );

  if (!removed.size && !/<Alert/.test(src)) continue;

  const needsSnackbar = /\benqueueSnackbar\s*\(/.test(src);
  const needsAlert = /<Alert(?![a-zA-Z])/.test(src);
  const needsAlertTitle = /<AlertTitle/.test(src);

  if (needsSnackbar && !/\benqueueSnackbar\b.*from/.test(src)) {
    src = addToImport(src, snackbarModule(file), ['enqueueSnackbar']);
  }

  const muiNames = [];
  if (needsAlert && !/import\s*\{[^}]*\bAlert\b[^}]*\}\s*from\s*'@mui\/material'/.test(src))
    muiNames.push('Alert');
  if (needsAlertTitle && !/import\s*\{[^}]*\bAlertTitle\b[^}]*\}\s*from\s*'@mui\/material'/.test(src))
    muiNames.push('AlertTitle');
  if (muiNames.length) src = addToImport(src, '@mui/material', muiNames);

  if (src !== original) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`fixed imports in ${changed} files`);
