import type { BexioLink, BexioPosition } from './client';
import type { BexioKind } from './parse';
import { type BexioInvoice, selectBexioOrders } from './select';

const KINDS: BexioKind[] = [
  {
    id: 'gift',
    label: 'Geschenkabo',
    word: 'NW Geschenkabo',
    refersTo: 'period',
  },
  {
    id: 'broker',
    label: 'Broker-Abo',
    word: 'NW Abo Endkund:in',
    refersTo: 'period',
  },
  { id: 'single', label: 'Einzelheft', word: 'Einzelheft', refersTo: 'issue' },
];

const PAID = 9;
const OPEN = 8;
const CANCELED = 19;

const invoice = (
  id: number,
  overrides: Partial<BexioInvoice> = {}
): BexioInvoice => ({
  id,
  title: 'Jahresabos 2027',
  api_reference: null,
  contact_id: 100 + id,
  kb_item_status_id: PAID,
  is_valid_from: '2026-11-01',
  document_nr: `RE-${id}`,
  ...overrides,
});

const links = (entries: [number, BexioLink[]][]) => new Map(entries);
const gift = (contactId: number): BexioLink => ({
  contactId,
  description: 'NW Geschenkabo',
});
const broker = (contactId: number): BexioLink => ({
  contactId,
  description: 'NW Abo Endkund:in, Abo 117049',
});

const positions =
  (byInvoice: Record<number, BexioPosition[]>) => async (id: number) =>
    byInvoice[id] ?? [];

// issue 1.27, shipped 15.01.2027
const BASE = {
  issue: '1.27',
  shipDay: '2027-01-15',
  kinds: KINDS,
  includeOpen: true,
  kindIds: null,
};

describe('selectBexioOrders — subscriptions over a period', () => {
  it('gives every linked recipient one copy while the ship day lies in the period', async () => {
    const { selected, stats, warnings } = await selectBexioOrders(
      [invoice(1)],
      {
        ...BASE,
        links: links([[101, [gift(201), gift(202), broker(203)]]]),
        fetchPositions: positions({
          1: [{ text: 'Jahresabo', quantity: 3 }],
        }),
      }
    );

    expect(
      selected.map(s => [s.recipientId, s.payerId, s.kind.id, s.copies])
    ).toEqual([
      [201, 101, 'gift', 1],
      [202, 101, 'gift', 1],
      [203, 101, 'broker', 1],
    ]);
    expect(selected[0]!.period).toEqual({
      from: '2027-01-01',
      to: '2027-12-31',
    });
    expect(stats.quantityMismatch).toBe(0);
    expect(warnings).toEqual([]);
  });

  it('reads a date range in the title, both ends included', async () => {
    const select = (title: string) =>
      selectBexioOrders([invoice(1, { title })], {
        ...BASE,
        links: links([[101, [gift(201)]]]),
        fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 1 }] }),
      });

    expect(
      (await select('Jahresabos 15.01.2026–15.01.2027')).selected
    ).toHaveLength(1);
    const ended = await select('Jahresabos 15.03.2026–14.01.2027');
    expect(ended.selected).toHaveLength(0);
    expect(ended.stats.otherPeriod).toBe(1);
    const later = await select('Jahresabos 16.01.2027–15.01.2028');
    expect(later.selected).toHaveLength(0);
    expect(later.stats.otherPeriod).toBe(1);
  });

  it('counts linked recipients of an invoice without a valid period, and gives them nothing', async () => {
    const { selected, stats } = await selectBexioOrders(
      [invoice(1, { title: 'Jahresabos 26' })],
      {
        ...BASE,
        links: links([[101, [gift(201)]]]),
        fetchPositions: positions({}),
      }
    );

    expect(selected).toEqual([]);
    expect(stats.noValidPeriod).toBe(1);
  });

  it('ignores links whose description names no configured kind', async () => {
    const { selected } = await selectBexioOrders([invoice(1)], {
      ...BASE,
      links: links([
        [101, [{ contactId: 205, description: 'Ehepartner' }, gift(201)]],
      ]),
      fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 1 }] }),
    });

    expect(selected.map(s => s.recipientId)).toEqual([201]);
  });

  it('warns when the billed quantity differs from the linked recipients', async () => {
    const { selected, stats, warnings } = await selectBexioOrders(
      [invoice(1)],
      {
        ...BASE,
        links: links([[101, [gift(201), gift(202)]]]),
        fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 3 }] }),
      }
    );

    expect(selected).toHaveLength(2);
    expect(stats.quantityMismatch).toBe(1);
    expect(warnings).toEqual([
      'bexio-Rechnung RE-1: 3 verrechnet, 2 verknüpft',
    ]);
  });
});

describe('selectBexioOrders — single copies', () => {
  it('sends the quantity of a single-copy line for this issue to the orderer', async () => {
    const { selected } = await selectBexioOrders(
      [invoice(1, { title: 'Bestellung' })],
      {
        ...BASE,
        links: links([]),
        fetchPositions: positions({
          1: [
            { text: 'Einzelheft 1.27', quantity: 3 },
            { text: 'Porto', quantity: 1 },
          ],
        }),
      }
    );

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      recipientId: 101,
      payerId: 101,
      copies: 3,
      issue: '1.27',
      period: null,
      kind: { id: 'single' },
    });
  });

  it('counts single-copy lines of other issues and without a valid issue', async () => {
    const { selected, stats } = await selectBexioOrders(
      [invoice(1, { title: 'Bestellung' })],
      {
        ...BASE,
        links: links([]),
        fetchPositions: positions({
          1: [
            { text: 'Einzelheft 6.26', quantity: 1 },
            { text: 'Einzelheft 26', quantity: 1 },
            { text: '1.27', quantity: 1 },
          ],
        }),
      }
    );

    expect(selected).toEqual([]);
    expect(stats.otherPeriod).toBe(1);
    expect(stats.noValidPeriod).toBe(1);
  });

  it('falls back to the copies prefix, then to one copy, without a quantity', async () => {
    const { selected } = await selectBexioOrders(
      [invoice(1, { title: 'Bestellung' })],
      {
        ...BASE,
        links: links([]),
        fetchPositions: positions({
          1: [
            { text: '2× Einzelheft 1.27', quantity: null },
            { text: 'Einzelheft 1.27', quantity: null },
          ],
        }),
      }
    );

    // «2×» without a quantity is 2, a bare line 1; same invoice and issue: one row
    expect(selected.map(s => s.copies)).toEqual([3]);
  });
});

describe('selectBexioOrders — single copies of a double issue', () => {
  it('takes orders naming the double issue or either of its numbers', async () => {
    const { selected, stats } = await selectBexioOrders(
      [
        invoice(1, { title: 'Bestellung' }),
        invoice(2, { title: 'Bestellung' }),
        invoice(3, { title: 'Bestellung' }),
        invoice(4, { title: 'Bestellung' }),
      ],
      {
        ...BASE,
        issue: '3/4.27',
        links: links([]),
        fetchPositions: positions({
          1: [{ text: 'Einzelheft 3/4.27', quantity: 1 }],
          2: [{ text: 'Einzelheft 3.27', quantity: 2 }],
          3: [{ text: 'Einzelheft 4.27', quantity: 3 }],
          4: [{ text: 'Einzelheft 5.27', quantity: 1 }],
        }),
      }
    );

    expect(selected.map(order => [order.recipientId, order.copies])).toEqual([
      [101, 1],
      [102, 2],
      [103, 3],
    ]);
    expect(stats.otherPeriod).toBe(1);
  });
});

describe('selectBexioOrders — one row per invoice and recipient', () => {
  it('adds up two single-copy lines of the same issue on one invoice', async () => {
    const { selected } = await selectBexioOrders(
      [invoice(1, { title: 'Bestellung' })],
      {
        ...BASE,
        links: links([]),
        fetchPositions: positions({
          1: [
            { text: 'Einzelheft 1.27', quantity: 2 },
            { text: 'Einzelheft 1.27', quantity: 3 },
          ],
        }),
      }
    );

    expect(selected.map(s => [s.recipientId, s.copies])).toEqual([[101, 5]]);
  });

  it('gives a recipient linked twice to the same payer one copy per link', async () => {
    const { selected } = await selectBexioOrders([invoice(1)], {
      ...BASE,
      links: links([[101, [gift(201), broker(201)]]]),
      fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 2 }] }),
    });

    expect(selected.map(s => [s.recipientId, s.copies])).toEqual([[201, 2]]);
  });
});

describe('selectBexioOrders — copies still owed after a period', () => {
  // a 12-month gift that ended before 1.27 shipped (15.01.2027): with 6
  // issues a year it is worth 6
  const ended = (overrides: Partial<BexioInvoice> = {}) =>
    invoice(1, { title: 'Jahresabos 15.01.2026–14.01.2027', ...overrides });
  const topUp = (
    delivered: Record<string, number>,
    historic: string[] = []
  ) => ({
    issuesPerYear: 6,
    historicIssues: historic.map(issueDate => ({ issueDate })),
    delivered: new Map(Object.entries(delivered)),
  });

  it('owes the recipient copies until the period’s share of the issues per year is reached', async () => {
    const { selected, stats } = await selectBexioOrders([ended()], {
      ...BASE,
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({}),
      topUp: topUp({ '1:201:2026-01-15': 4 }),
    });

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      recipientId: 201,
      copies: 1,
      period: { from: '2026-01-15', to: '2027-01-14' },
      owed: { delivered: 4, entitled: 6 },
    });
    expect(stats.otherPeriod).toBe(0);
  });

  it('counts historic issues inside the period as received', async () => {
    const { selected } = await selectBexioOrders([ended()], {
      ...BASE,
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({}),
      topUp: topUp({ '1:201:2026-01-15': 4 }, ['2026-08-23', '2026-10-14']),
    });

    // 4 delivered + 2 historic = 6 of 6: nothing owed
    expect(selected).toEqual([]);
  });

  it('counts a historic double issue as two received copies', async () => {
    const { selected } = await selectBexioOrders([ended()], {
      ...BASE,
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({}),
      topUp: {
        ...topUp({ '1:201:2026-01-15': 4 }),
        historicIssues: [{ issueDate: '2026-08-23', countsAs: 2 }],
      },
    });

    // 4 delivered + a double issue = 6 of 6: nothing owed
    expect(selected).toEqual([]);
  });

  it('sends a double issue to a recipient owed one copy and says what it counts as', async () => {
    const { selected } = await selectBexioOrders([ended()], {
      ...BASE,
      issue: '1/2.27',
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({}),
      topUp: { ...topUp({ '1:201:2026-01-15': 5 }), countsAs: 2 },
    });

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      owed: { delivered: 5, entitled: 6, countsAs: 2 },
    });
  });

  it('owes nothing while the quota is off, and nothing for an older period', async () => {
    const off = await selectBexioOrders([ended()], {
      ...BASE,
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({}),
      topUp: { ...topUp({}), issuesPerYear: 0 },
    });
    expect(off.selected).toEqual([]);

    const older = await selectBexioOrders(
      [
        ended(),
        invoice(2, {
          title: 'Jahresabos 15.01.2025–14.01.2026',
          contact_id: 101,
        }),
      ],
      {
        ...BASE,
        links: links([[101, [gift(201)]]]),
        fetchPositions: positions({}),
        topUp: topUp({}),
      }
    );
    // only the latest ended period of a recipient is topped up
    expect(older.selected.map(s => s.invoice.id)).toEqual([1]);
  });

  it('owes nothing to a recipient who gets this issue through a running period', async () => {
    const { selected } = await selectBexioOrders(
      [ended(), invoice(2, { contact_id: 101 })],
      {
        ...BASE,
        links: links([[101, [gift(201)]]]),
        fetchPositions: positions({ 2: [{ text: 'Jahresabo', quantity: 1 }] }),
        topUp: topUp({}),
      }
    );

    expect(selected.map(s => [s.invoice.id, s.owed ?? null])).toEqual([
      [2, null],
    ]);
  });
});

describe('selectBexioOrders — what is left out', () => {
  it('skips cancelled invoices and the payment provider’s own invoices', async () => {
    const fetchPositions = vi.fn(positions({}));
    const { selected, stats } = await selectBexioOrders(
      [
        invoice(1, { kb_item_status_id: CANCELED }),
        invoice(2, { api_reference: '01a1c465-d90a-73ed-8090-20395309f8a8' }),
      ],
      {
        ...BASE,
        links: links([
          [101, [gift(201)]],
          [102, [gift(202)]],
        ]),
        fetchPositions,
      }
    );

    expect(selected).toEqual([]);
    expect(stats).toMatchObject({ canceled: 1, skippedProvider: 1 });
    expect(fetchPositions).not.toHaveBeenCalled();
  });

  it('counts open invoices only while «offen» is on', async () => {
    const run = (includeOpen: boolean) =>
      selectBexioOrders([invoice(1, { kb_item_status_id: OPEN })], {
        ...BASE,
        includeOpen,
        links: links([[101, [gift(201)]]]),
        fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 1 }] }),
      });

    expect((await run(true)).selected).toHaveLength(1);
    const off = await run(false);
    expect(off.selected).toEqual([]);
    expect(off.stats.skippedOpen).toBe(1);
  });

  it('reads only the kinds the options name and counts the others', async () => {
    const { selected, stats } = await selectBexioOrders([invoice(1)], {
      ...BASE,
      kindIds: ['broker'],
      links: links([[101, [gift(201), broker(203)]]]),
      fetchPositions: positions({ 1: [{ text: 'Jahresabo', quantity: 2 }] }),
    });

    expect(selected.map(s => s.recipientId)).toEqual([203]);
    expect(stats.excludedKind).toBe(1);
  });

  it('selects nothing while no kind is configured', async () => {
    const { selected } = await selectBexioOrders([invoice(1)], {
      ...BASE,
      kinds: [],
      links: links([[101, [gift(201)]]]),
      fetchPositions: positions({
        1: [{ text: 'Einzelheft 1.27', quantity: 1 }],
      }),
    });

    expect(selected).toEqual([]);
  });

  it('reads positions only up to the cap and counts the rest as unchecked', async () => {
    const fetchPositions = vi.fn(positions({}));
    const { stats } = await selectBexioOrders(
      [
        invoice(1, { title: 'Bestellung' }),
        invoice(2, { title: 'Bestellung' }),
        invoice(3, { title: 'Bestellung' }),
      ],
      { ...BASE, links: links([]), fetchPositions, detailMax: 2 }
    );

    expect(fetchPositions).toHaveBeenCalledTimes(2);
    expect(stats).toMatchObject({ detailFetched: 2, ungeprueft: 1 });
  });
});
