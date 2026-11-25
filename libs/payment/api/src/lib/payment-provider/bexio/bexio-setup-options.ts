export const BEXIO_API_URL = 'https://api.bexio.com';

/** One choice for a bexio id the integration needs, named as bexio shows it. */
export type BexioSetupOption = { id: number; label: string };

export type BexioSetupOptions = {
  accounts: BexioSetupOption[];
  taxes: BexioSetupOption[];
  units: BexioSetupOption[];
  users: BexioSetupOption[];
  countries: BexioSetupOption[];
};

type Row = Record<string, unknown> & { id: number };

const rows = (list: unknown): Row[] => (Array.isArray(list) ? list : []);
const text = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const byLabel = (a: BexioSetupOption, b: BexioSetupOption) =>
  a.label.localeCompare(b.label, 'de', { numeric: true });

/**
 * What an admin picks from when setting up bexio, instead of looking up
 * bexio's internal numbers: revenue accounts, sales taxes, units, the user
 * invoices are made by, and the default country of new contacts.
 */
export async function fetchBexioSetupOptions(
  fetchJson: (path: string) => Promise<unknown>
): Promise<BexioSetupOptions> {
  const [accounts, taxes, units, users, countries] = await Promise.all([
    fetchJson('/2.0/accounts'),
    fetchJson('/3.0/taxes?scope=active&types=sales_tax'),
    fetchJson('/2.0/unit'),
    fetchJson('/3.0/users'),
    fetchJson('/2.0/country'),
  ]);

  return {
    accounts: rows(accounts)
      .filter(account => account['is_active'] !== false)
      .map(account => ({
        id: account.id,
        label: `${text(account['account_no'])} ${text(account['name'])}`.trim(),
      }))
      .sort(byLabel),
    taxes: rows(taxes)
      .map(tax => ({
        id: tax.id,
        label: `${text(tax['display_name'] ?? tax['name'])} (${text(tax['value'])}%)`,
      }))
      .sort(byLabel),
    units: rows(units)
      .map(unit => ({ id: unit.id, label: text(unit['name']) }))
      .sort(byLabel),
    users: rows(users)
      .map(user => ({
        id: user.id,
        label:
          `${text(user['firstname'])} ${text(user['lastname'])}`.trim() +
          (user['email'] ? ` (${text(user['email'])})` : ''),
      }))
      .sort(byLabel),
    countries: rows(countries)
      .map(country => ({
        id: country.id,
        label:
          text(country['name']) +
          (country['name_short'] ? ` (${text(country['name_short'])})` : ''),
      }))
      .sort(byLabel),
  };
}

/** Reads one bexio endpoint with the integration's API token. */
export const bexioFetcher =
  (apiKey: string) =>
  async (path: string): Promise<unknown> => {
    const response = await fetch(`${BEXIO_API_URL}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30_000) as unknown as RequestInit['signal'],
    });

    if (!response.ok) {
      throw new Error(
        `bexio answered ${response.status} for ${path.split('?')[0]}`
      );
    }

    return response.json();
  };
