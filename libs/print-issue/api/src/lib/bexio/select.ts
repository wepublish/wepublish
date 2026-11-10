import { parseBexioText, type ParsedBexioText } from './parse';

export type BexioInvoice = {
  id: number;
  title: string | null;
  api_reference: string | null;
  contact_id: number;
  kb_item_status_id: number;
  is_valid_from: string;
};

export type SelectedInvoice = {
  invoice: BexioInvoice;
  parsed: ParsedBexioText;
};

export type SelectStats = {
  invoicesInWindow: number;
  canceled: number;
  otherPeriod: number;
  einzelheftOhneAusgabe: number;
  skippedImported: number;
  skippedProvider: number;
  detailFetched: number;
  detailUnparsed: number;
  ungeprueft: number;
  zeroCopies: number;
};

type Options = {
  year: number;
  issue: string;
  /** the position texts of one invoice; only needed for hand-made invoices */
  fetchPositions: (id: number) => Promise<string[]>;
  detailMax?: number;
  concurrency?: number;
};

const CANCELED = 19;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Picks the invoices whose holder gets copies of the issue: yearly kinds of
 * the issue's year, single-issue orders of exactly this issue. The title is
 * enough for imported and convention-following invoices; invoices staff
 * wrote by hand are looked at position by position, up to a cap.
 */
export async function selectBexioInvoices(
  invoices: BexioInvoice[],
  { year, issue, fetchPositions, detailMax = 300, concurrency = 4 }: Options
): Promise<{ selected: SelectedInvoice[]; stats: SelectStats }> {
  const stats: SelectStats = {
    invoicesInWindow: invoices.length,
    canceled: 0,
    otherPeriod: 0,
    einzelheftOhneAusgabe: 0,
    skippedImported: 0,
    skippedProvider: 0,
    detailFetched: 0,
    detailUnparsed: 0,
    ungeprueft: 0,
    zeroCopies: 0,
  };
  const selected: SelectedInvoice[] = [];
  const needDetail: BexioInvoice[] = [];

  const consider = (invoice: BexioInvoice, parsed: ParsedBexioText) => {
    const wanted =
      parsed.kind === 'Einzelheft' ?
        parsed.issue ?
          parsed.issue === issue
        : null
      : parsed.year === year;

    if (wanted === null) {
      stats.einzelheftOhneAusgabe++;
    } else if (!wanted) {
      stats.otherPeriod++;
    } else if (parsed.copies < 1) {
      stats.zeroCopies++;
    } else {
      selected.push({ invoice, parsed });
    }
  };

  for (const invoice of invoices) {
    if (invoice.kb_item_status_id === CANCELED) {
      stats.canceled++;
      continue;
    }

    const parsed = parseBexioText(invoice.title);

    if (parsed) {
      consider(invoice, parsed);
      continue;
    }

    const reference = invoice.api_reference ?? '';

    if (reference.startsWith('nw-rg:')) {
      stats.skippedImported++;
    } else if (UUID.test(reference)) {
      stats.skippedProvider++;
    } else {
      needDetail.push(invoice);
    }
  }

  const toFetch = needDetail.slice(0, detailMax);
  stats.ungeprueft = needDetail.length - toFetch.length;
  stats.detailFetched = toFetch.length;

  const details: (ParsedBexioText | null)[] = new Array(toFetch.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, toFetch.length) }, async () => {
      while (next < toFetch.length) {
        const index = next++;
        const texts = await fetchPositions(toFetch[index]!.id);
        details[index] =
          texts.map(parseBexioText).find(p => p !== null) ?? null;
      }
    })
  );

  toFetch.forEach((invoice, index) => {
    const parsed = details[index];

    if (parsed) {
      consider(invoice, parsed);
    } else {
      stats.detailUnparsed++;
    }
  });

  // input order, so the file is stable between runs
  const position = new Map(
    invoices.map((invoice, index) => [invoice.id, index])
  );
  selected.sort(
    (a, b) => position.get(a.invoice.id)! - position.get(b.invoice.id)!
  );

  return { selected, stats };
}
