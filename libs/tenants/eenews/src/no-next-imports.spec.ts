import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * ee-news runs on TanStack Start. Any `next/*` import throws at render time
 * ("NextRouter was not mounted") and takes every page down — but the website
 * Vitest setup aliases `next/router` to a mock, so render specs cannot catch
 * it. Guard the source instead.
 */
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return /\.tsx?$/.test(entry) && !/\.spec\.tsx?$/.test(entry) ? [path] : [];
  });

describe('tenant-eenews', () => {
  it('does not import from next/*', () => {
    const offenders = sourceFiles(__dirname).filter(file =>
      /from ['"]next\//.test(readFileSync(file, 'utf8'))
    );

    expect(offenders.map(file => relative(__dirname, file))).toEqual([]);
  });
});
