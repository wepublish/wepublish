/**
 * rsuite CSS variables -> MUI theme tokens.
 *
 *   color: var(--rs-text-secondary);
 *     -> color: ${({ theme }) => theme.palette.text.secondary};
 *
 * These are the last thing holding `rsuite/dist/rsuite.css` in the bundle: the
 * variables are defined by that stylesheet and by nothing else.
 *
 * Only occurrences inside a template literal are rewritten — that is where an
 * `${}` interpolation is valid. The rest are JS strings in `sx`/`style`
 * objects and are reported for conversion by hand, since whether a callback is
 * allowed there depends on which prop holds them.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** rsuite variable -> the expression that replaces it, given `theme`. */
const TOKENS = {
  'text-primary': 'theme.palette.text.primary',
  'text-secondary': 'theme.palette.text.secondary',
  'text-heading': 'theme.palette.text.primary',
  'text-disabled': 'theme.palette.text.disabled',
  'text-error': 'theme.palette.error.main',
  'text-link': 'theme.palette.primary.main',
  'text-link-active': 'theme.palette.primary.dark',
  'border-primary': 'theme.palette.divider',
  'border-secondary': 'theme.palette.divider',
  'bg-card': 'theme.palette.background.paper',
  'bg-overlay': 'theme.palette.background.paper',
  'bg-well': 'theme.palette.background.default',
  'bg-active': 'theme.palette.action.selected',
  'body': 'theme.palette.background.default',
  'navbar-default-bg': 'theme.palette.background.paper',
  'primary-500': 'theme.palette.primary.main',
  'primary-600': 'theme.palette.primary.dark',
  'primary-700': 'theme.palette.primary.dark',
  'state-error': 'theme.palette.error.main',
  'state-warning': 'theme.palette.warning.main',
  'state-success': 'theme.palette.success.main',
  'state-info': 'theme.palette.info.main',
  // rsuite's radii are 4 / 6 / 8px; the editor theme's base radius is 8.
  // `shape.borderRadius` is a number, and raw CSS needs the unit spelled out.
  // `shape.borderRadius` is typed `number | string`, so the smaller radii go
  // through `calc` rather than arithmetic.
  'radius-sm': '`calc(${theme.shape.borderRadius}px * 0.5)`',
  'radius-md': '`calc(${theme.shape.borderRadius}px * 0.75)`',
  'radius-lg': 'theme.shape.borderRadius + \'px\'',
  'shadow-overlay': 'theme.shadows[8]',
  'font-size-sm': 'theme.typography.body2.fontSize',
  'heading-h1-font-size': 'theme.typography.h1.fontSize',
  'heading-h1-line-height': 'theme.typography.h1.lineHeight',
  'gray-100': 'theme.palette.grey[100]',
  'gray-200': 'theme.palette.grey[200]',
  'gray-300': 'theme.palette.grey[300]',
  'gray-400': 'theme.palette.grey[400]',
  'gray-500': 'theme.palette.grey[500]',
  'gray-600': 'theme.palette.grey[600]',
  'gray-700': 'theme.palette.grey[700]',
  'gray-800': 'theme.palette.grey[800]',
};

/** Which character positions sit inside a template literal. */
const templateMask = src => {
  const inside = new Array(src.length).fill(false);
  const quoted = new Array(src.length).fill(false);
  let i = 0;
  let openAt = null;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if ((c === '"' || c === "'") && openAt === null) {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (c === '`') {
      if (openAt === null) {
        openAt = i;
      } else {
        for (let j = openAt; j <= i; j++) inside[j] = true;
        openAt = null;
      }
    } else if (openAt !== null && (c === '"' || c === "'")) {
      // A quoted string *inside* a template is still a string: an `${}` put
      // there is literal text, not an interpolation.
      const q = c;
      const from = i;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
      for (let j = from; j <= i; j++) quoted[j] = true;
    }
    i++;
  }
  return inside.map((value, at) => value && !quoted[at]);
};

let converted = 0;
const unknown = new Map();
const outside = new Map();

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  const inside = templateMask(src);

  let out = '';
  let last = 0;
  for (const match of src.matchAll(/var\(--rs-([a-z0-9-]+)(?:,\s*[^)]*)?\)/g)) {
    const token = TOKENS[match[1]];
    if (!token) {
      unknown.set(match[1], (unknown.get(match[1]) ?? 0) + 1);
      continue;
    }
    if (!inside[match.index]) {
      outside.set(file, (outside.get(file) ?? 0) + 1);
      continue;
    }
    out += src.slice(last, match.index) + `\${({ theme }) => ${token}}`;
    last = match.index + match[0].length;
    converted++;
  }
  out += src.slice(last);

  if (out !== src) writeFileSync(file, out);
}

console.log(`converted ${converted} variables`);
if (unknown.size) {
  console.log('\nno token for:');
  for (const [name, count] of [...unknown].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}  --rs-${name}`);
  }
}
if (outside.size) {
  const total = [...outside.values()].reduce((a, b) => a + b, 0);
  console.log(`\n${total} outside a template literal, in ${outside.size} files:`);
  for (const [file, count] of [...outside].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}  ${file}`);
  }
}
