import de from './de.json';
import fr from './fr.json';

type Catalog = { [key: string]: string | Catalog };

function keysOf(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) =>
    typeof value === 'string' ?
      [`${prefix}${key}`]
    : keysOf(value, `${prefix}${key}.`)
  );
}

describe('website translation catalogs', () => {
  it('fr has every key de has', () => {
    const frKeys = new Set(keysOf(fr as Catalog));

    expect(keysOf(de as Catalog).filter(key => !frKeys.has(key))).toEqual([]);
  });

  it('de has every key fr has', () => {
    const deKeys = new Set(keysOf(de as Catalog));

    expect(keysOf(fr as Catalog).filter(key => !deKeys.has(key))).toEqual([]);
  });
});
