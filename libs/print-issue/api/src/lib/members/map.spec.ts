import { subscriptionToRow } from './map';
import type { Subscription, User } from './types';

const user = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'max@example.com',
  firstName: 'Max',
  name: 'Muster',
  address: {
    company: null,
    streetAddress: 'Bahnhofstrasse',
    streetAddressNumber: '1',
    streetAddress2: 'Postfach 12',
    streetAddress2Number: null,
    zipCode: '8001',
    city: 'Zürich',
    country: 'Schweiz',
  },
  properties: [
    { key: 'nw_adressnummer', value: '100' },
    { key: 'nw_anrede', value: 'Herr' },
    { key: 'nw_bemerkungen', value: 'Bitte 2. Stock' },
  ],
  ...overrides,
});

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  startsAt: '2024-01-01T00:00:00.000Z',
  paidUntil: '2026-12-31T00:00:00.000Z',
  autoRenew: true,
  deactivation: null,
  memberPlan: {
    id: 'plan-1',
    slug: 'nw-jahresabo',
    name: 'Jahresabo',
    productType: 'Subscription',
    printIssues: {},
  },
  properties: [{ key: 'nw_adressnummer', value: '200' }],
  userId: 'user-1',
  periods: [],
  openInvoiceIds: [],
  deliveries: [],
  ...overrides,
});

const status = { zahlungsstatus: 'bezahlt bis 31.12.2026' };

describe('subscriptionToRow', () => {
  it('maps a member with an address', () => {
    expect(subscriptionToRow(subscription(), user(), status)).toEqual({
      quelle: 'wepublish',
      adressnummer: '200',
      anrede: 'Herr',
      firma: '',
      vorname: 'Max',
      name: 'Muster',
      zusatz: 'Postfach 12',
      strasse: 'Bahnhofstrasse',
      hausnummer: '1',
      plz: '8001',
      ort: 'Zürich',
      land: 'Schweiz',
      anzahl: 1,
      aboTyp: 'Jahresabo',
      zahlungsstatus: 'bezahlt bis 31.12.2026',
      beginn: '01.01.2024',
      email: 'max@example.com',
      bemerkungen: 'Bitte 2. Stock',
      hinweis: '',
    });
  });

  it('falls back to the user address number and the full organisation name', () => {
    const row = subscriptionToRow(
      subscription({ properties: [] }),
      user({
        name: 'Verein für sehr lange Namen die abgeschnitten wu',
        address: { ...user().address!, company: 'Verein' },
        properties: [
          { key: 'nw_adressnummer', value: '100' },
          {
            key: 'nw_name_full',
            value: 'Verein für sehr lange Namen die abgeschnitten wurden e.V.',
          },
        ],
      }),
      status
    );

    expect(row.adressnummer).toBe('100');
    expect(row.firma).toBe(
      'Verein für sehr lange Namen die abgeschnitten wurden e.V.'
    );
  });

  it('blanks placeholder e-mails and says so', () => {
    const row = subscriptionToRow(
      subscription(),
      user({ email: 'nw-100@placeholder.neuewege.ch' }),
      status
    );

    expect(row.email).toBe('');
    expect(row.hinweis).toBe('Platzhalter-E-Mail');
  });

  it('keeps a member without an address and flags the row', () => {
    const row = subscriptionToRow(
      subscription(),
      user({ address: null }),
      status
    );

    expect(row.strasse).toBe('');
    expect(row.plz).toBe('');
    expect(row.hinweis).toBe('Keine Adresse');
  });

  it('joins both address-2 parts', () => {
    const row = subscriptionToRow(
      subscription(),
      user({
        address: {
          ...user().address!,
          streetAddress2: 'Hinterhaus',
          streetAddress2Number: '3',
        },
      }),
      status
    );

    expect(row.zusatz).toBe('Hinterhaus 3');
  });
});
