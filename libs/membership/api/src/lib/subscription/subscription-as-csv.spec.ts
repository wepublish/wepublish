import { mapSubscriptionsAsCsv } from './subscription-as-csv';

const row = (overrides: Record<string, unknown>) =>
  ({
    user: { id: 'user-1' },
    memberPlan: { name: 'Abo' },
    paymentMethod: { name: 'Rechnung' },
    invoices: [],
    deactivation: null,
    ...overrides,
  }) as never;

const parse = (csv: string) => {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const columns = header.split(',');

  return lines.map(line => {
    const values = line.split(',');

    return Object.fromEntries(columns.map((column, i) => [column, values[i]]));
  });
};

describe('mapSubscriptionsAsCsv', () => {
  it('exports when a subscription was imported and that it is legacy', () => {
    const [exported] = parse(
      mapSubscriptionsAsCsv([
        row({
          importedAt: new Date('2026-11-01T08:00:00Z'),
          legacyEndedAt: null,
        }),
      ])
    );

    expect(exported).toMatchObject({
      importedAt: '2026-11-01',
      legacy: 'true',
    });
  });

  it('exports an imported subscription that was paid for here as not legacy', () => {
    const [exported] = parse(
      mapSubscriptionsAsCsv([
        row({
          importedAt: new Date('2026-11-01T08:00:00Z'),
          legacyEndedAt: new Date('2026-11-19T10:00:00Z'),
        }),
      ])
    );

    expect(exported).toMatchObject({
      importedAt: '2026-11-01',
      legacy: 'false',
    });
  });

  it('leaves the import date empty for a subscription created here', () => {
    const [exported] = parse(
      mapSubscriptionsAsCsv([row({ importedAt: null, legacyEndedAt: null })])
    );

    expect(exported).toMatchObject({ importedAt: '', legacy: 'false' });
  });
});
