/**
 * The rsuite variables left in `sx`/`style` objects -> MUI system values.
 *
 *   sx={{ color: 'var(--rs-text-secondary)' }}
 *     -> sx={{ color: 'text.secondary' }}
 *   sx={{ borderRadius: 'var(--rs-radius-md)' }}
 *     -> sx={{ borderRadius: 0.75 }}      // sx multiplies `shape.borderRadius`
 *
 * Only the keys the system resolves tokens for are rewritten; everything else
 * is reported, because `'divider'` means nothing to a key the system does not
 * map.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Keys whose string value the MUI system resolves against the palette. */
const COLOR_KEYS = new Set([
  'color',
  'bgcolor',
  'backgroundColor',
  'background',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'fill',
  'stroke',
  'caretColor',
  'columnRuleColor',
  'outlineColor',
  'textDecorationColor',
]);

const COLORS = {
  'text-primary': 'text.primary',
  'text-secondary': 'text.secondary',
  'text-heading': 'text.primary',
  'text-disabled': 'text.disabled',
  'text-error': 'error.main',
  'border-primary': 'divider',
  'border-secondary': 'divider',
  'bg-card': 'background.paper',
  'bg-overlay': 'background.paper',
  'bg-well': 'background.default',
  'body': 'background.default',
  'primary-500': 'primary.main',
  'state-error': 'error.main',
  'state-warning': 'warning.main',
  'state-success': 'success.main',
  'state-info': 'info.main',
  'green-500': 'success.main',
  'orange-500': 'warning.main',
  'red-700': 'error.dark',
  'gray-400': 'grey.400',
};

/** `borderRadius` in `sx` is a multiple of `shape.borderRadius` (8 here). */
const RADII = { 'radius-sm': '0.5', 'radius-md': '0.75', 'radius-lg': '1' };

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(
    /([A-Za-z][\w]*)(\s*:\s*)'var\(--rs-([a-z0-9-]+)(?:,\s*[^')]*)?\)'/g,
    (whole, key, between, name) => {
      if (key === 'borderRadius' && RADII[name]) {
        converted++;
        return `${key}${between}${RADII[name]}`;
      }
      if (COLOR_KEYS.has(key) && COLORS[name]) {
        converted++;
        return `${key}${between}'${COLORS[name]}'`;
      }
      skipped.push(`${file}: ${key}: --rs-${name}`);
      return whole;
    }
  );

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} values`);
if (skipped.length) {
  console.log('\nleft for conversion by hand:');
  for (const entry of [...new Set(skipped)]) console.log(`  ${entry}`);
}
