import de from './de.json';
import en from './en.json';
import fr from './fr.json';

type Catalog = { [key: string]: string | Catalog };

function keysOf(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) =>
    typeof value === 'string' ?
      [`${prefix}${key}`]
    : keysOf(value, `${prefix}${key}.`)
  );
}

const catalogs = { de, en, fr } as Record<string, Catalog>;

describe('website translation catalogs', () => {
  for (const [name, catalog] of Object.entries(catalogs)) {
    for (const [otherName, other] of Object.entries(catalogs)) {
      if (name === otherName) {
        continue;
      }

      it(`${name} has every key ${otherName} has`, () => {
        const keys = new Set(keysOf(catalog));

        expect(keysOf(other).filter(key => !keys.has(key))).toEqual([]);
      });
    }
  }
});
