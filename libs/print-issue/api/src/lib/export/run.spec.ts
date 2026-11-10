import type { BexioClient } from '../bexio/client';
import type { MemberSource, Subscription, User } from '../members/types';
import { runExport } from './run';

const plan = {
  id: 'p1',
  slug: 'nw-jahresabo',
  name: 'Jahresabo',
  productType: 'Subscription',
  printIssues: {},
};
const donation = {
  ...plan,
  id: 'p2',
  slug: 'nw-spende',
  name: 'Spende',
  productType: 'Donation',
};

const user = (overrides: Partial<User> & { id: string }): User => ({
  email: 'a@example.com',
  firstName: 'Anna',
  name: 'Alpha',
  address: {
    company: null,
    streetAddress: 'Seestrasse',
    streetAddressNumber: '5',
    streetAddress2: null,
    streetAddress2Number: null,
    zipCode: '8002',
    city: 'Zürich',
    country: 'Schweiz',
  },
  properties: [],
  ...overrides,
});

const subscription = (
  overrides: Partial<Subscription> & { id: string; userId: string }
): Subscription => ({
  startsAt: '2024-01-01T00:00:00.000Z',
  paidUntil: '2026-12-31T00:00:00.000Z',
  autoRenew: true,
  deactivation: null,
  memberPlan: plan,
  properties: [],
  periods: [],
  openInvoiceIds: [],
  deliveries: [],
  ...overrides,
});

const period2026 = {
  id: 'per-2026',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2026-12-31T00:00:00.000Z',
  paymentPeriodicity: 'yearly',
  paid: true,
  invoiceId: 'inv-2026',
};

const USERS = [
  user({ id: 'u1' }),
  user({
    id: 'u2',
    email: 'nw-2@placeholder.neuewege.ch',
    firstName: 'Ben',
    name: 'Beta',
    address: null,
  }),
  user({ id: 'u3', firstName: 'Cora', name: 'Gamma' }),
];

const SUBSCRIPTIONS = [
  subscription({
    id: 's1',
    userId: 'u1',
    properties: [{ key: 'nw_adressnummer', value: '100' }],
    periods: [period2026],
  }),
  subscription({
    id: 's2',
    userId: 'u2',
    paidUntil: '2026-09-30T00:00:00.000Z',
  }),
  subscription({
    id: 's3',
    userId: 'u1',
    paidUntil: null,
    autoRenew: false,
    memberPlan: donation,
  }),
];

const membersOf =
  (subscriptions: Subscription[], users = USERS): MemberSource =>
  async () => ({
    subscriptions,
    users: new Map(users.map(u => [u.id, u])),
    warnings: [],
  });

const members = membersOf(SUBSCRIPTIONS);

const bexio: BexioClient = {
  invoicesInWindow: vi.fn(async () => ({
    path: 'search' as const,
    invoices: [
      {
        id: 1,
        title: '3× Institutionelles Abo 2026',
        api_reference: 'nw-rg:1',
        contact_id: 10,
        kb_item_status_id: 7,
        is_valid_from: '2025-11-03',
      },
      {
        id: 2,
        title: 'Geschenkabo 2025',
        api_reference: 'nw-rg:2',
        contact_id: 10,
        kb_item_status_id: 7,
        is_valid_from: '2025-01-03',
      },
    ],
  })),
  positions: vi.fn(async () => []),
  contacts: vi.fn(
    async () =>
      new Map([
        [
          10,
          {
            id: 10,
            contact_type_id: 1,
            salutation_id: null,
            name_1: 'Stadtbibliothek',
            name_2: null,
            street_name: 'Zähringerplatz',
            house_number: '6',
            address_addition: null,
            address: null,
            postcode: '8001',
            city: 'Zürich',
            country_id: 1,
            mail: 'bib@example.com',
            remarks: 'NeueWege-Import Adr 900',
          },
        ],
      ])
  ),
  countries: vi.fn(async () => new Map([[1, 'Schweiz']])),
  salutations: vi.fn(async () => new Map()),
};

const INPUT = { issue: '6.26', date: '2026-10-13' };

describe('runExport', () => {
  it('joins both sources into rows, recipient drafts, a summary and a file name', async () => {
    const result = await runExport(INPUT, { members, bexio });

    expect(result.filename).toBe('druckliste-6.26-2026-10-13.csv');
    expect(
      result.rows.map(r => [
        r.quelle,
        r.name || r.firma,
        r.anzahl,
        r.zahlungsstatus,
        r.hinweis,
      ])
    ).toEqual([
      ['wepublish', 'Alpha', 1, 'bezahlt bis 31.12.2026', ''],
      ['wepublish', 'Beta', 1, 'offen', 'Platzhalter-E-Mail; Keine Adresse'],
      ['bexio', 'Stadtbibliothek', 3, '', ''],
    ]);
    expect(result.recipients).toEqual([
      {
        source: 'wepublish',
        reason: 'paid',
        copies: 1,
        userId: 'u1',
        subscriptionId: 's1',
        periodId: 'per-2026',
        bexioInvoiceId: null,
        bexioContactId: null,
        snapshot: result.rows[0],
      },
      {
        source: 'wepublish',
        reason: 'openInvoice',
        copies: 1,
        userId: 'u2',
        subscriptionId: 's2',
        periodId: null,
        bexioInvoiceId: null,
        bexioContactId: null,
        snapshot: result.rows[1],
      },
      {
        source: 'bexio',
        reason: 'external',
        copies: 3,
        userId: null,
        subscriptionId: null,
        periodId: null,
        bexioInvoiceId: 1,
        bexioContactId: 10,
        snapshot: result.rows[2],
      },
    ]);
    expect(result.summary).toMatchObject({
      issue: '6.26',
      date: '2026-10-13',
      includeUpcoming: false,
      rows: 3,
      copies: 5,
      bySource: { wepublish: 2, bexio: 1 },
      byPlan: { Jahresabo: 2 },
      byKind: { 'Institutionelles Abo': 1 },
      unpaid: 1,
      openWithoutInvoice: 1,
      grace: 0,
      gifts: 0,
      kuendigungen: 0,
      missingAddress: 1,
      placeholderEmail: 1,
      duplicates: 0,
      alreadyExported: 0,
      totalSubscriptions: 3,
      skipped: {
        donation: 1,
        excludedPlan: 0,
        future: 0,
        unpaidDeactivation: 0,
        replaced: 0,
        deactivated: 0,
        lapsed: 0,
        exhausted: 0,
      },
      bexio: {
        configured: true,
        included: true,
        path: 'search',
        invoicesInWindow: 2,
        otherPeriod: 1,
      },
      warnings: [],
    });
    expect(result.csv.startsWith('\uFEFF"Quelle"')).toBe(true);
    // the year in the text decides; the date window only has to be wide enough
    // for subscriptions paid years ahead (gifts for 2026 invoiced in 2024)
    expect(bexio.invoicesInWindow).toHaveBeenCalledWith(
      '2021-01-01',
      '2026-12-31'
    );
  });

  it('runs without bexio and says so', async () => {
    const result = await runExport(INPUT, { members, bexio: null });

    expect(result.rows.map(r => r.quelle)).toEqual(['wepublish', 'wepublish']);
    expect(result.summary.bexio).toMatchObject({
      configured: false,
      included: false,
      invoicesInWindow: 0,
    });
    expect(result.summary.warnings).toContain(
      'bexio: kein Zahlungsanbieter mit API-Schlüssel konfiguriert – keine Institutionen, Geschenke, Buchhandel und Einzelhefte'
    );
  });

  it('leaves bexio out when the options say so, even though it is configured', async () => {
    const result = await runExport(
      { ...INPUT, includeBexio: false },
      { members, bexio }
    );

    expect(bexio.invoicesInWindow).not.toHaveBeenCalled();
    expect(result.rows.map(r => r.quelle)).toEqual(['wepublish', 'wepublish']);
    expect(result.summary.bexio).toMatchObject({
      configured: true,
      included: false,
    });
    expect(result.summary.warnings).toEqual([]);
  });

  it('applies the plan allowlist', async () => {
    const result = await runExport(
      { ...INPUT, memberPlanIds: ['nope'] },
      { members, bexio: null }
    );

    expect(result.rows).toEqual([]);
    expect(result.summary.skipped).toMatchObject({
      excludedPlan: 2,
      donation: 1,
    });
  });

  it('counts the copies still owed and the gifts', async () => {
    const lapsed = subscription({
      id: 's4',
      userId: 'u3',
      autoRenew: false,
      paidUntil: '2026-09-30T00:00:00.000Z',
      deactivation: {
        date: '2026-09-30T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      periods: [
        {
          id: 'per-s4',
          startsAt: '2025-10-01T00:00:00.000Z',
          endsAt: '2026-09-30T00:00:00.000Z',
          paymentPeriodicity: 'yearly',
          paid: true,
          invoiceId: 'inv-s4',
        },
      ],
    });
    const upcoming = subscription({
      id: 's5',
      userId: 'u2',
      startsAt: '2026-11-01T00:00:00.000Z',
      paidUntil: '2027-10-31T00:00:00.000Z',
      autoRenew: false,
    });
    const upcomingButServed = subscription({
      id: 's6',
      userId: 'u1',
      startsAt: '2026-11-01T00:00:00.000Z',
      paidUntil: '2027-10-31T00:00:00.000Z',
      autoRenew: false,
    });
    const source = membersOf([
      SUBSCRIPTIONS[0]!,
      lapsed,
      upcoming,
      upcomingButServed,
    ]);
    const quota = {
      issuesPerYear: 6,
      historicIssues: [{ issueDate: '2026-08-23' }],
    };

    const off = await runExport(
      { ...INPUT, quota },
      { members: source, bexio: null }
    );
    expect(off.rows.map(r => [r.name, r.zahlungsstatus])).toEqual([
      ['Alpha', 'bezahlt bis 31.12.2026'],
      ['Gamma', 'Restexemplar 2/6'],
    ]);
    expect(off.summary).toMatchObject({
      grace: 1,
      gifts: 0,
      skipped: { future: 2 },
    });
    expect(off.recipients[1]).toMatchObject({
      reason: 'grace',
      periodId: 'per-s4',
    });

    const on = await runExport(
      { ...INPUT, quota, includeUpcoming: true },
      { members: source, bexio: null }
    );
    expect(on.rows.map(r => [r.name, r.zahlungsstatus])).toEqual([
      ['Alpha', 'bezahlt bis 31.12.2026'],
      ['Gamma', 'Restexemplar 2/6'],
      ['Beta', 'Vorab-Exemplar, Abo ab 01.11.2026'],
    ]);
    expect(on.summary).toMatchObject({
      includeUpcoming: true,
      grace: 1,
      gifts: 1,
      skipped: { future: 1 },
    });
    expect(on.recipients[2]).toMatchObject({
      reason: 'gift',
      periodId: null,
      subscriptionId: 's5',
    });
  });

  it('leaves out what an earlier batch of the issue already exported', async () => {
    const result = await runExport(
      { ...INPUT, excludeSubscriptionIds: ['s1'], excludeBexioInvoiceIds: [1] },
      { members, bexio }
    );

    expect(result.rows.map(r => r.name || r.firma)).toEqual(['Beta']);
    expect(result.summary).toMatchObject({ alreadyExported: 2, rows: 1 });
  });

  it('warns when no member has an address number at all', async () => {
    const result = await runExport(INPUT, {
      members: membersOf([subscription({ id: 's1', userId: 'u1' })], []),
      bexio,
    });

    expect(result.summary.warnings).toContain(
      'Keine Adressnummern gefunden (nw_adressnummer) – Import prüfen'
    );
  });
});
