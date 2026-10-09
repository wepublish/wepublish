/**
 * Wrap a spec's `render(...)` trees in a MUI `ThemeProvider`.
 *
 * The migrated components are MUI components, and the shared atoms style
 * themselves from the theme through emotion. Emotion hands a styled component
 * `{}` when no provider is mounted, so `theme.palette.…` throws — in the app
 * there is always a provider, and now the specs match that.
 */
import { readFileSync, writeFileSync } from 'node:fs';

let changed = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  if (src.includes('ThemeProvider')) continue;
  if (!/\brender\s*\(/.test(src)) continue;

  // Wrap the JSX argument of every render(...) call.
  src = src.replace(
    /(\brender\s*\(\s*\n)(\s*)(<[\s\S]*?\n)(\s*)\);/g,
    (match, open, indent, body, closeIndent) => {
      // `indent` was captured separately, so the first line needs it back.
      const lines = body.split('\n');
      const reindented = lines
        .map((line, i) =>
          i === 0 ? `${indent}  ${line}`
          : line.trim() ? `  ${line}`
          : line
        )
        .join('\n');
      return (
        `${open}${indent}<ThemeProvider theme={theme}>\n` +
        `${reindented}` +
        `${indent}</ThemeProvider>\n${closeIndent});`
      );
    }
  );

  // Single-line `render(<X />);` too.
  src = src.replace(
    /\brender\(\s*(<[^\n]*\/>)\s*\);/g,
    (match, jsx) => `render(\n    <ThemeProvider theme={theme}>${'\n      '}${jsx}\n    </ThemeProvider>\n  );`
  );

  if (src === original) continue;

  // `theme` and the import.
  if (!/const theme = createTheme\(\)/.test(src)) {
    src = src.replace(
      /^(import .*\n)(?![\s\S]*^import )/m,
      match => match
    );
    const lines = src.split('\n');
    let lastImport = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i]) || /^\}\s+from\s+'/.test(lines[i]))
        lastImport = i;
    }
    lines.splice(
      lastImport + 1,
      0,
      "import { createTheme, ThemeProvider } from '@mui/material';",
      '',
      'const theme = createTheme();'
    );
    src = lines.join('\n');
  }

  writeFileSync(file, src);
  changed++;
}

console.log(`wrapped ${changed} specs in a ThemeProvider`);
