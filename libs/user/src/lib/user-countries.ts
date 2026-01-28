import countries from 'i18n-iso-countries';
import germanCountries from 'i18n-iso-countries/langs/de.json';

countries.registerLocale(germanCountries);

export const userCountries = countries.getNames('de', { select: 'all' });

export const selectCountryName = (names: string[]) => names.at(-1)!;

export const userCountryNames = Object.values(userCountries).map(
  selectCountryName
) as [string, ...string[]];
