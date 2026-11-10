import { createBexioClient } from './client';

const noSleep = { sleep: async () => undefined };

const invoice = (id: number, is_valid_from: string) => ({
  id,
  title: 'Geschenkabo 2026',
  api_reference: null,
  contact_id: 1,
  kb_item_status_id: 7,
  is_valid_from,
});

type Call = [string, RequestInit];

const client = (fetchFn: ReturnType<typeof vi.fn>) =>
  createBexioClient({
    apiUrl: 'https://api.bexio.test',
    token: 'pat',
    fetchFn: fetchFn as unknown as typeof fetch,
    retry: noSleep,
  });

describe('invoicesInWindow', () => {
  it('searches by invoice date page by page until a page is short', async () => {
    const full = Array.from({ length: 2000 }, (_, i) =>
      invoice(i, '2026-01-01')
    );
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(Response.json(full))
      .mockResolvedValueOnce(Response.json([invoice(5000, '2026-02-02')]));

    const result = await client(fetchFn).invoicesInWindow(
      '2025-07-01',
      '2026-12-31'
    );

    expect(result.path).toBe('search');
    expect(result.invoices).toHaveLength(2001);
    const [url, init] = fetchFn.mock.calls[0] as unknown as Call;
    expect(url).toBe(
      'https://api.bexio.test/2.0/kb_invoice/search?limit=2000&offset=0'
    );
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer pat');
    expect(JSON.parse(String(init.body))).toEqual([
      { field: 'is_valid_from', value: '2025-07-01', criteria: '>=' },
      { field: 'is_valid_from', value: '2026-12-31', criteria: '<=' },
    ]);
    expect((fetchFn.mock.calls[1] as unknown as Call)[0]).toContain(
      'offset=2000'
    );
  });

  it('falls back to listing everything when the search rejects the field', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{"error":"bad field"}', { status: 400 })
      )
      .mockResolvedValueOnce(
        Response.json([
          invoice(1, '2024-03-01'),
          invoice(2, '2025-09-15'),
          invoice(3, '2027-01-02'),
        ])
      );

    const result = await client(fetchFn).invoicesInWindow(
      '2025-07-01',
      '2026-12-31'
    );

    expect(result.path).toBe('list');
    expect(result.invoices.map(i => i.id)).toEqual([2]);
    expect((fetchFn.mock.calls[1] as unknown as Call)[0]).toBe(
      'https://api.bexio.test/2.0/kb_invoice?limit=2000&offset=0'
    );
  });
});

describe('positions', () => {
  it('turns position HTML into plain text: tags separate words, entities decoded, nothing tag-like left', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({
        id: 8,
        positions: [
          { text: '<p>1×</p><p>Einzelheft<br>6.26</p>' },
          { text: '2&nbsp;× Buchhandel 2026 &amp; Porto' },
          // malformed markup a single pass would leave a tag behind in
          { text: '<scr<script>ipt>alert(1)</script>Geschenkabo 2026' },
          { text: '<p> </p>' },
        ],
      })
    );

    const texts = (await client(fetchFn).positions(8)).map(p => p.text);

    expect(texts.slice(0, 2)).toEqual([
      '1× Einzelheft 6.26',
      '2 × Buchhandel 2026 & Porto',
    ]);
    expect(texts[2]).toMatch(/Geschenkabo 2026$/);
    expect(texts).toHaveLength(3);
    for (const text of texts) {
      expect(text).not.toMatch(/[<>]/);
    }
  });

  it('keeps an entity out of range as written instead of failing the read', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({ id: 9, positions: [{ text: 'Abo &#99999999; 2026' }] })
    );

    await expect(client(fetchFn).positions(9)).resolves.toEqual([
      { text: 'Abo &#99999999; 2026', quantity: null },
    ]);
  });

  it('returns the plain text and the quantity of every position', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({
        id: 7,
        positions: [
          {
            type: 'KbPositionArticle',
            text: '<p>Einzelausgabe 6.26</p>',
            amount: '3.000000',
          },
          { type: 'KbPositionText', text: 'Porto' },
          { type: 'KbPositionCustom', text: 'Jahresabo', amount: 'x' },
        ],
      })
    );

    await expect(client(fetchFn).positions(7)).resolves.toEqual([
      { text: 'Einzelausgabe 6.26', quantity: 3 },
      { text: 'Porto', quantity: null },
      { text: 'Jahresabo', quantity: null },
    ]);
    expect((fetchFn.mock.calls[0] as unknown as Call)[0]).toBe(
      'https://api.bexio.test/2.0/kb_invoice/7'
    );
  });
});

describe('contactLinks', () => {
  it('reads every contact link page by page, in both directions', async () => {
    const links = [
      {
        id: 1,
        contact_id: 10,
        contact_sub_id: 20,
        description: 'NW Geschenkabo',
      },
      {
        id: 2,
        contact_id: 30,
        contact_sub_id: 10,
        description: 'NW Abo Endkund:in, Abo 117049',
      },
      { id: 3, contact_id: 10, contact_sub_id: 21, description: null },
    ];
    const fetchFn = vi.fn(async () => Response.json(links));

    const byContact = await client(fetchFn).contactLinks();

    expect((fetchFn.mock.calls[0] as unknown as Call)[0]).toBe(
      'https://api.bexio.test/2.0/contact_relation?limit=2000&offset=0'
    );
    // contact 10 is linked to 20 and 21 as the main contact, and to 30 as the sub
    expect(byContact.get(10)).toEqual([
      { contactId: 20, description: 'NW Geschenkabo' },
      { contactId: 30, description: 'NW Abo Endkund:in, Abo 117049' },
      { contactId: 21, description: '' },
    ]);
    expect(byContact.get(20)).toEqual([
      { contactId: 10, description: 'NW Geschenkabo' },
    ]);
  });
});

describe('contacts', () => {
  it('indexes every contact by id', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      Response.json([
        { id: 1, name_1: 'A' },
        { id: 2, name_1: 'B' },
      ])
    );

    const contacts = await client(fetchFn).contacts();

    expect([...contacts.keys()]).toEqual([1, 2]);
    expect((fetchFn.mock.calls[0] as unknown as Call)[0]).toBe(
      'https://api.bexio.test/2.0/contact?limit=2000&offset=0'
    );
  });
});

describe('lookups', () => {
  it('maps countries and salutations and tolerates a missing right', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(Response.json([{ id: 1, name: 'Schweiz' }]))
      .mockResolvedValueOnce(new Response('', { status: 403 }));

    const c = client(fetchFn);

    await expect(c.countries()).resolves.toEqual(new Map([[1, 'Schweiz']]));
    await expect(c.salutations()).resolves.toEqual(new Map());
  });
});
