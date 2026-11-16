import { BexioCountries } from './bexio-countries';

const list = [
  { id: 1, name: 'Schweiz', name_short: 'CH', iso3166_alpha2: 'CH' },
  { id: 2, name: 'Deutschland', name_short: 'DE', iso3166_alpha2: 'DE' },
];

describe('BexioCountries', () => {
  it('answers by iso code, however the country is written', async () => {
    const countries = await BexioCountries.load(async () => list, 1);

    expect(countries.idFor('Deutschland')).toBe(2);
    expect(countries.idFor('de')).toBe(2);
    expect(countries.idFor('CH')).toBe(1);
    expect(countries.idFor('Switzerland')).toBe(1);
  });

  it('falls back to the configured country for an unknown or missing one', async () => {
    const countries = await BexioCountries.load(async () => list, 1);

    expect(countries.idFor('Narnia')).toBe(1);
    expect(countries.idFor(null)).toBe(1);
  });

  it('falls back for everything when bexio answers nothing usable', async () => {
    const countries = await BexioCountries.load(
      async () => ({ error: 'nope' }) as never,
      22
    );

    expect(countries.idFor('DE')).toBe(22);
  });
});
