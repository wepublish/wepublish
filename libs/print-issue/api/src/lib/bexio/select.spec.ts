import { selectBexioInvoices, type BexioInvoice } from './select';

const invoice = (overrides: Partial<BexioInvoice> = {}): BexioInvoice => ({
  id: 1,
  title: 'Geschenkabo 2026',
  api_reference: 'nw-rg:4711',
  contact_id: 10,
  kb_item_status_id: 7,
  is_valid_from: '2025-11-03',
  ...overrides,
});

const noDetail = vi.fn(async () => [] as string[]);

describe('selectBexioInvoices', () => {
  beforeEach(() => noDetail.mockClear());

  it('selects yearly subscriptions of the issue year and single issues of the issue', async () => {
    const { selected, stats } = await selectBexioInvoices(
      [
        invoice({ id: 1, title: 'Geschenkabo 2026' }),
        invoice({ id: 2, title: '3× Institutionelles Abo 2026 (Rg 1)' }),
        invoice({ id: 3, title: 'Buchhandel 2025' }),
        invoice({ id: 4, title: '12× Einzelheft 6.26', api_reference: null }),
        invoice({ id: 5, title: 'Einzelheft 5.26', api_reference: null }),
        invoice({ id: 6, title: 'Einzelheft 2026' }),
      ],
      { year: 2026, issue: '6.26', fetchPositions: noDetail }
    );

    expect(selected.map(s => [s.invoice.id, s.parsed.copies])).toEqual([
      [1, 1],
      [2, 3],
      [4, 12],
    ]);
    expect(stats).toMatchObject({
      invoicesInWindow: 6,
      otherPeriod: 2,
      einzelheftOhneAusgabe: 1,
    });
    expect(noDetail).not.toHaveBeenCalled();
  });

  it('drops cancelled invoices and counts them', async () => {
    const { selected, stats } = await selectBexioInvoices(
      [invoice({ kb_item_status_id: 19 })],
      { year: 2026, issue: '6.26', fetchPositions: noDetail }
    );

    expect(selected).toEqual([]);
    expect(stats.canceled).toBe(1);
  });

  it('skips imported memberships and provider invoices without fetching details', async () => {
    const { selected, stats } = await selectBexioInvoices(
      [
        invoice({
          id: 1,
          title: 'Jahresabo 2026 (Rg 1)',
          api_reference: 'nw-rg:1',
        }),
        invoice({
          id: 2,
          title: 'Rechnung',
          api_reference: '7d3c2b1a-0000-4000-8000-000000000000',
        }),
      ],
      { year: 2026, issue: '6.26', fetchPositions: noDetail }
    );

    expect(selected).toEqual([]);
    expect(stats).toMatchObject({ skippedImported: 1, skippedProvider: 1 });
    expect(noDetail).not.toHaveBeenCalled();
  });

  it('reads the positions of invoices staff created by hand', async () => {
    const fetchPositions = vi.fn(async (id: number) =>
      id === 1 ? ['Porto', '2× Institutionelles Abo 2026'] : ['Beratung']
    );

    const { selected, stats } = await selectBexioInvoices(
      [
        invoice({ id: 1, title: 'Rechnung Bibliothek', api_reference: null }),
        invoice({ id: 2, title: 'Rechnung', api_reference: '' }),
      ],
      { year: 2026, issue: '6.26', fetchPositions }
    );

    expect(
      selected.map(s => [s.invoice.id, s.parsed.kind, s.parsed.copies])
    ).toEqual([[1, 'Institutionelles Abo', 2]]);
    expect(stats).toMatchObject({ detailFetched: 2, detailUnparsed: 1 });
  });

  it('stops fetching details at the cap and counts the rest as unchecked', async () => {
    const fetchPositions = vi.fn(async () => ['Geschenkabo 2026']);
    const invoices = [1, 2, 3].map(id =>
      invoice({ id, title: 'Rechnung', api_reference: null })
    );

    const { selected, stats } = await selectBexioInvoices(invoices, {
      year: 2026,
      issue: '6.26',
      fetchPositions,
      detailMax: 2,
    });

    expect(fetchPositions).toHaveBeenCalledTimes(2);
    expect(selected).toHaveLength(2);
    expect(stats.ungeprueft).toBe(1);
  });

  it('does not select zero copies', async () => {
    const { selected, stats } = await selectBexioInvoices(
      [invoice({ title: '0× Geschenkabo 2026' })],
      { year: 2026, issue: '6.26', fetchPositions: noDetail }
    );

    expect(selected).toEqual([]);
    expect(stats.zeroCopies).toBe(1);
  });
});
