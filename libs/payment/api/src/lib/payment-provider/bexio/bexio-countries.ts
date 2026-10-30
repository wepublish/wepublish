import { normalizeCountry } from '@wepublish/utils/api';

/** A row of bexio's `GET /2.0/country`. */
export interface BexioCountry {
  id: number;
  name: string;
  name_short?: string;
  iso3166_alpha2?: string;
}

/**
 * bexio's country ids by iso code, so a reader's address gets the country it
 * names. An unknown or missing country gets the integration's configured one,
 * as every contact did before the lookup existed.
 */
export class BexioCountries {
  private constructor(
    private readonly byIso: Map<string, number>,
    readonly fallback: number
  ) {}

  static async load(
    fetchList: () => Promise<BexioCountry[]>,
    fallback: number
  ): Promise<BexioCountries> {
    const list = await fetchList();

    return BexioCountries.of(Array.isArray(list) ? list : [], fallback);
  }

  static of(list: BexioCountry[], fallback: number): BexioCountries {
    const byIso = new Map<string, number>();

    for (const country of list) {
      for (const code of [country.iso3166_alpha2, country.name_short]) {
        if (
          code &&
          /^[a-zA-Z]{2}$/.test(code) &&
          !byIso.has(code.toUpperCase())
        ) {
          byIso.set(code.toUpperCase(), country.id);
        }
      }
    }

    return new BexioCountries(byIso, fallback);
  }

  idFor(country: string | null | undefined): number {
    const iso = normalizeCountry(country);

    return (iso && this.byIso.get(iso)) || this.fallback;
  }
}
