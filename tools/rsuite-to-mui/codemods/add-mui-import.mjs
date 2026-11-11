/**
 * Adds named imports from `@mui/material` to files that use them but do not
 * import them. Run after a codemod that introduces MUI components.
 *
 *   node add-mui-import.mjs TextField InputAdornment -- <files...>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const split = process.argv.indexOf('--');
const names = process.argv.slice(2, split);
const files = process.argv.slice(split + 1);

let touched = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  const needed = names.filter(name => {
    const used = new RegExp(`<${name}[\\s/>]`).test(src);
    if (!used) return false;
    // A local `const Stack = styled(...)` owns the name; importing MUI's on
    // top of it is a redeclaration, not a fix.
    if (
      new RegExp(`^\\s*(?:export\\s+)?(?:const|let|function|class)\\s+${name}\\b`, 'm').test(
        src
      )
    ) {
      return false;
    }
    // Already imported under its own name, from anywhere other than rsuite?
    // An rsuite import of the same name is the thing being replaced, and it
    // silently shadowed the MUI one for as long as it stayed.
    const imports = [
      ...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']*)';/gs),
    ];
    return !imports.some(
      ([, names, from]) =>
        from !== 'rsuite' &&
        new RegExp(`\\b${name}\\b(?!\\s+as)`).test(names)
    );
  });

  if (!needed.length) continue;

  // Drop the rsuite import of each name being added, or it wins the binding.
  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*'rsuite';\n/s,
    (whole, names) => {
      const kept = names
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry && !needed.includes(entry));
      return kept.length ? `import { ${kept.join(', ')} } from 'rsuite';\n` : '';
    }
  );

  const existing = src.match(
    /import\s*\{([^}]*)\}\s*from\s*'@mui\/material';/s
  );

  if (existing) {
    const current = existing[1]
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);
    const merged = [...new Set([...current, ...needed])].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    src =
      src.slice(0, existing.index) +
      `import {\n${merged.map(name => `  ${name},\n`).join('')}} from '@mui/material';` +
      src.slice(existing.index + existing[0].length);
  } else {
    // Put it after the last import so `simple-import-sort` has something to
    // work with; lint --fix orders it properly afterwards.
    const lastImport = [...src.matchAll(/^import .*;$/gm)].at(-1);
    const line = `import {\n${needed
      .sort()
      .map(name => `  ${name},\n`)
      .join('')}} from '@mui/material';`;
    src =
      lastImport ?
        src.slice(0, lastImport.index) +
        line +
        '\n' +
        src.slice(lastImport.index)
      : line + '\n' + src;
  }

  if (src !== original) {
    writeFileSync(file, src);
    touched++;
  }
}

console.log(`added imports to ${touched} files`);
