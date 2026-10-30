// The names the address form collects today, in the languages readers write
// them. Anything else must already be an iso code.
const COUNTRY_CODES: Record<string, string> = {
  schweiz: 'CH',
  suisse: 'CH',
  svizzera: 'CH',
  svizra: 'CH',
  switzerland: 'CH',
  deutschland: 'DE',
  germany: 'DE',
  allemagne: 'DE',
  österreich: 'AT',
  oesterreich: 'AT',
  austria: 'AT',
  autriche: 'AT',
  liechtenstein: 'LI',
  frankreich: 'FR',
  france: 'FR',
  francia: 'FR',
  italien: 'IT',
  italy: 'IT',
  italia: 'IT',
  italie: 'IT',
};

/** The ISO 3166-1 alpha-2 code of a country as a reader wrote it, or null. */
export function normalizeCountry(
  country: string | null | undefined
): string | null {
  const value = country?.trim();

  if (!value) {
    return null;
  }

  if (/^[a-zA-Z]{2}$/.test(value)) {
    return value.toUpperCase();
  }

  return COUNTRY_CODES[value.toLowerCase()] ?? null;
}
