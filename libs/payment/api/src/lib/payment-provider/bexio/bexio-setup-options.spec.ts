import { fetchBexioSetupOptions } from './bexio-setup-options';

const responses: Record<string, unknown> = {
  '/2.0/accounts': [
    { id: 7, account_no: '3400', name: 'Abonnemente', is_active: true },
    { id: 3, account_no: '3200', name: 'Inserate', is_active: true },
    { id: 9, account_no: '9999', name: 'Alt', is_active: false },
  ],
  '/3.0/taxes?scope=active&types=sales_tax': [
    { id: 28, display_name: 'UN81', value: 8.1 },
    { id: 31, display_name: 'UR26', value: 2.6 },
  ],
  '/2.0/unit': [{ id: 2, name: 'Stk' }],
  '/3.0/users': [
    { id: 1, firstname: 'Mia', lastname: 'Muster', email: 'mia@example.ch' },
  ],
  '/2.0/country': [
    { id: 1, name: 'Schweiz', name_short: 'CH' },
    { id: 2, name: 'Deutschland', name_short: 'DE' },
  ],
};

const fakeFetch = (path: string) => {
  if (!(path in responses)) {
    throw new Error(`unexpected ${path}`);
  }

  return Promise.resolve(responses[path]);
};

describe('fetchBexioSetupOptions', () => {
  it('names the ids an integration needs the way bexio shows them', async () => {
    await expect(fetchBexioSetupOptions(fakeFetch)).resolves.toEqual({
      accounts: [
        { id: 3, label: '3200 Inserate' },
        { id: 7, label: '3400 Abonnemente' },
      ],
      taxes: [
        { id: 28, label: 'UN81 (8.1%)' },
        { id: 31, label: 'UR26 (2.6%)' },
      ],
      units: [{ id: 2, label: 'Stk' }],
      users: [{ id: 1, label: 'Mia Muster (mia@example.ch)' }],
      countries: [
        { id: 2, label: 'Deutschland (DE)' },
        { id: 1, label: 'Schweiz (CH)' },
      ],
    });
  });

  it('copes with a list bexio leaves empty', async () => {
    const empty = (path: string) =>
      path === '/2.0/unit' ? Promise.resolve(null) : fakeFetch(path);

    await expect(fetchBexioSetupOptions(empty)).resolves.toMatchObject({
      units: [],
    });
  });
});
