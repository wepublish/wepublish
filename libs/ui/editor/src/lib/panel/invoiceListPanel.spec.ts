import { InvoiceFragment } from '@wepublish/editor/api';

import { sortByBillingDate } from './invoiceListPanel';

const invoice = (id: string, createdAt: string, dueAt?: string | null) =>
  ({ id, createdAt, dueAt }) as unknown as InvoiceFragment;

describe('sortByBillingDate', () => {
  const imported2023 = invoice(
    'imported-2023',
    '2026-09-01T00:00:00.000Z',
    '2023-01-01T00:00:00.000Z'
  );
  const imported2024 = invoice(
    'imported-2024',
    '2026-09-01T00:00:00.000Z',
    '2024-01-01T00:00:00.000Z'
  );
  const created2025 = invoice(
    'created-2025',
    '2025-01-01T00:00:00.000Z',
    '2025-01-01T00:00:00.000Z'
  );

  it('puts the latest billing date first by default', () => {
    expect(
      sortByBillingDate([imported2023, created2025, imported2024]).map(
        ({ id }) => id
      )
    ).toEqual(['created-2025', 'imported-2024', 'imported-2023']);
  });

  it('can sort oldest first', () => {
    expect(
      sortByBillingDate([created2025, imported2023, imported2024], 'asc').map(
        ({ id }) => id
      )
    ).toEqual(['imported-2023', 'imported-2024', 'created-2025']);
  });

  it('falls back to createdAt when an invoice has no due date', () => {
    const undated = invoice('undated', '2024-06-01T00:00:00.000Z', null);

    expect(
      sortByBillingDate([imported2024, undated, created2025]).map(
        ({ id }) => id
      )
    ).toEqual(['created-2025', 'undated', 'imported-2024']);
  });

  it('leaves the given list untouched', () => {
    const invoices = [imported2023, created2025];

    sortByBillingDate(invoices);

    expect(invoices).toEqual([imported2023, created2025]);
  });
});
