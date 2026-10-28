import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const LIB = join(__dirname, '..');

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sources(path);
    }

    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ?
        [path]
      : [];
  });

describe('cache-manager features the tiered store cannot serve', () => {
  const files = sources(LIB);

  it('finds the sources of the lib', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain(join(LIB, 'store', 'tiered-keyv-store.ts'));
  });

  it.each([
    ['.wrap(', /\.wrap\(/],
    ['.clear(', /(?<!\b(?:super|timers|entries))\.clear\(/],
    ['nonBlocking: true', /nonBlocking:\s*true/],
  ])('never uses %s', (_, pattern) => {
    expect(
      files.filter(file => pattern.test(readFileSync(file, 'utf8')))
    ).toEqual([]);
  });
});
