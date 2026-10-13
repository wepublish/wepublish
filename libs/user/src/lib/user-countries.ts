import countries from 'i18n-iso-countries';
import germanCountries from 'i18n-iso-countries/langs/de.json';
import frenchCountries from 'i18n-iso-countries/langs/fr.json';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { isEmpty } from 'ramda';

countries.registerLocale(germanCountries);
countries.registerLocale(frenchCountries);
countries.registerLocale(englishCountries);

export const userCountries = countries.getNames('de', { select: 'all' });

export const userCountriesForLanguage = (locale: string) => {
  const names = countries.getNames(locale, { select: 'all' });
  return isEmpty(names) ? userCountries : names;
};

export const selectCountryName = (names: string[]) => names.at(-1)!;

export const userCountryNames = Object.values(userCountries).map(
  selectCountryName
) as [string, ...string[]];
