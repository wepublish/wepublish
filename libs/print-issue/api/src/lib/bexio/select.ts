import type { BexioLink, BexioPosition } from './client';
import {
  type BexioKind,
  type BexioPeriod,
  inPeriod,
  matchKind,
  parsePeriod,
  readIssueOrder,
} from './parse';

export type BexioInvoice = {
  id: number;
  title: string | null;
  api_reference: string | null;
  contact_id: number;
  kb_item_status_id: number;
  is_valid_from: string;
  document_nr?: string | null;
};

/** One recipient's copies of the issue, and the order they come from. */
export type BexioOrder = {
  invoice: BexioInvoice;
  /** the contact the invoice goes to */
  payerId: number;
  /** the contact who receives the copies: a linked recipient, or the orderer */
  recipientId: number;
  kind: BexioKind;
  copies: number;
  /** subscriptions over a period: the period the ship day lies in */
  period: BexioPeriod | null;
  /** single copies: the issue ordered */
  issue: string | null;
  /** a copy still owed after the period ended: what it got, what it is worth */
  owed?: { delivered: number; entitled: number };
};

/** What decides copies still owed after a bexio period ended. */
export type BexioTopUp = {
  /** the medium's issues per year; 0 = no copies owed */
  issuesPerYear: number;
  /** ship days of the issues before tracking: inside a period they count as received */
  historicIssues: string[];
  /** copies in delivered lists by `${invoiceId}:${recipientId}:${period.from}` */
  delivered: Map<string, number>;
};

export type SelectStats = {
  invoicesInWindow: number;
  canceled: number;
  skippedProvider: number;
  skippedImported: number;
  /** unpaid, while the options leave «offen» out */
  skippedOpen: number;
  /** a period or issue that does not cover this issue */
  otherPeriod: number;
  /** a kind's word without a valid year, date range or issue */
  noValidPeriod: number;
  /** of a kind the options leave out */
  excludedKind: number;
  zeroCopies: number;
  /** invoices whose billed quantity differs from the linked recipients */
  quantityMismatch: number;
  detailFetched: number;
  ungeprueft: number;
};

type Options = {
  issue: string;
  /** the issue's ship day, YYYY-MM-DD */
  shipDay: string;
  kinds: BexioKind[];
  /** contact links by contact */
  links: Map<number, BexioLink[]>;
  includeOpen: boolean;
  /** only these kinds; null = every configured kind */
  kindIds: string[] | null;
  fetchPositions: (id: number) => Promise<BexioPosition[]>;
  topUp?: BexioTopUp;
  detailMax?: number;
  concurrency?: number;
};

const PAID = 9;
const CANCELED = 19;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Picks who receives copies of the issue from bexio, as the medium's kinds
 * describe it:
 * - subscriptions over a period: the invoice's contact pays, its contact links
 *   whose description starts with a «period» kind's word receive one copy
 *   each, while the ship day lies in the period the title names (a year or a
 *   date range); the billed quantity is checked against the links;
 * - single copies: a position starting with an «issue» kind's word and naming
 *   this issue sends its quantity to the invoice's contact.
 * Only valid selectors select: a word without a valid period or issue counts
 * as `noValidPeriod` and gives no copy.
 */
export async function selectBexioOrders(
  invoices: BexioInvoice[],
  {
    issue,
    shipDay,
    kinds,
    links,
    includeOpen,
    kindIds,
    fetchPositions,
    topUp,
    detailMax = 300,
    concurrency = 4,
  }: Options
): Promise<{ selected: BexioOrder[]; stats: SelectStats; warnings: string[] }> {
  const stats: SelectStats = {
    invoicesInWindow: invoices.length,
    canceled: 0,
    skippedProvider: 0,
    skippedImported: 0,
    skippedOpen: 0,
    otherPeriod: 0,
    noValidPeriod: 0,
    excludedKind: 0,
    zeroCopies: 0,
    quantityMismatch: 0,
    detailFetched: 0,
    ungeprueft: 0,
  };
  const selected: BexioOrder[] = [];
  const warnings: string[] = [];
  const wanted = (kind: BexioKind) => !kindIds || kindIds.includes(kind.id);
  // single copies are ordered around their issue: older invoices are not read
  const earliest = new Date(Date.parse(shipDay) - YEAR_MS)
    .toISOString()
    .slice(0, 10);

  /** periods that ended before the ship day: their recipients may still be owed copies */
  const ended: {
    invoice: BexioInvoice;
    recipientId: number;
    kind: BexioKind;
    period: BexioPeriod;
  }[] = [];

  /** invoices whose positions are read, and the linked recipients to check them against */
  const toRead: { invoice: BexioInvoice; linked: number | null }[] = [];

  for (const invoice of invoices) {
    if (invoice.kb_item_status_id === CANCELED) {
      stats.canceled++;
      continue;
    }

    if (UUID.test(invoice.api_reference ?? '')) {
      stats.skippedProvider++;
      continue;
    }

    if (!includeOpen && invoice.kb_item_status_id !== PAID) {
      stats.skippedOpen++;
      continue;
    }

    const recipients = (links.get(invoice.contact_id) ?? [])
      .map(link => ({
        link,
        match: matchKind(link.description, kinds, 'period'),
      }))
      .filter(entry => entry.match !== null);

    if (recipients.length) {
      const period = parsePeriod(invoice.title);

      if (!period) {
        stats.noValidPeriod++;
        continue;
      }

      if (!inPeriod(shipDay, period)) {
        if (topUp?.issuesPerYear && period.to < shipDay) {
          for (const { link, match } of recipients) {
            ended.push({
              invoice,
              recipientId: link.contactId,
              kind: match!.kind,
              period,
            });
          }
        } else {
          stats.otherPeriod++;
        }
        continue;
      }

      for (const { link, match } of recipients) {
        if (!wanted(match!.kind)) {
          stats.excludedKind++;
          continue;
        }

        selected.push({
          invoice,
          payerId: invoice.contact_id,
          recipientId: link.contactId,
          kind: match!.kind,
          copies: 1,
          period,
          issue: null,
        });
      }

      toRead.push({ invoice, linked: recipients.length });
      continue;
    }

    if ((invoice.api_reference ?? '').startsWith('nw-rg:')) {
      stats.skippedImported++;
      continue;
    }

    if (invoice.is_valid_from.slice(0, 10) >= earliest) {
      toRead.push({ invoice, linked: null });
    }
  }

  const reading = toRead.slice(0, detailMax);
  stats.detailFetched = reading.length;
  stats.ungeprueft = toRead.length - reading.length;

  const read: BexioPosition[][] = new Array(reading.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, reading.length) }, async () => {
      while (next < reading.length) {
        const index = next++;
        read[index] = await fetchPositions(reading[index]!.invoice.id);
      }
    })
  );

  reading.forEach(({ invoice, linked }, index) => {
    const positions = read[index] ?? [];
    let billed = 0;
    let quantified = false;

    for (const position of positions) {
      const order = readIssueOrder(position.text, kinds);

      if (!order) {
        if (position.quantity !== null) {
          billed += position.quantity;
          quantified = true;
        }
        continue;
      }

      if (!order.issue) {
        stats.noValidPeriod++;
      } else if (order.issue !== issue) {
        stats.otherPeriod++;
      } else if (!wanted(order.kind)) {
        stats.excludedKind++;
      } else {
        const copies = position.quantity ?? order.copies ?? 1;

        if (copies < 1) {
          stats.zeroCopies++;
        } else {
          selected.push({
            invoice,
            payerId: invoice.contact_id,
            recipientId: invoice.contact_id,
            kind: order.kind,
            copies,
            period: null,
            issue: order.issue,
          });
        }
      }
    }

    if (linked !== null && quantified && billed !== linked) {
      stats.quantityMismatch++;
      warnings.push(
        `bexio-Rechnung ${invoice.document_nr ?? invoice.id}: ${billed} verrechnet, ${linked} verknüpft`
      );
    }
  });

  // copies still owed: only the latest ended period of a payer's recipient,
  // only while that recipient gets no copy of this issue otherwise
  const latest = new Map<string, (typeof ended)[number]>();

  for (const entry of ended) {
    const key = `${entry.invoice.contact_id}:${entry.recipientId}`;
    const known = latest.get(key);

    if (!known || entry.period.to > known.period.to) {
      latest.set(key, entry);
    }
  }

  const receiving = new Set(selected.map(entry => entry.recipientId));

  for (const entry of ended) {
    const key = `${entry.invoice.contact_id}:${entry.recipientId}`;
    const owed =
      topUp && latest.get(key) === entry && !receiving.has(entry.recipientId) ?
        owedCopies(entry, topUp)
      : null;

    if (!owed || owed.delivered >= owed.entitled) {
      stats.otherPeriod++;
    } else if (!wanted(entry.kind)) {
      stats.excludedKind++;
    } else {
      selected.push({
        invoice: entry.invoice,
        payerId: entry.invoice.contact_id,
        recipientId: entry.recipientId,
        kind: entry.kind,
        copies: 1,
        period: entry.period,
        issue: null,
        owed,
      });
    }
  }

  // one row per invoice and recipient: two lines of the same issue, or a
  // recipient linked twice, add up their copies on the first entry
  const merged = new Map<string, BexioOrder>();

  for (const entry of selected) {
    const key = `${entry.invoice.id}:${entry.recipientId}`;
    const first = merged.get(key);

    if (first) {
      first.copies += entry.copies;
    } else {
      merged.set(key, { ...entry });
    }
  }

  // input order, so the file is stable between runs
  const order = new Map(invoices.map((invoice, index) => [invoice.id, index]));
  const rows = [...merged.values()].sort(
    (a, b) => order.get(a.invoice.id)! - order.get(b.invoice.id)!
  );

  return { selected: rows, stats, warnings };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** What a period is worth (its share of the issues per year) and what it got. */
function owedCopies(
  {
    invoice,
    recipientId,
    period,
  }: { invoice: BexioInvoice; recipientId: number; period: BexioPeriod },
  { issuesPerYear, historicIssues, delivered }: BexioTopUp
) {
  const days = (Date.parse(period.to) - Date.parse(period.from)) / DAY_MS + 1;
  const months = Math.round(days / (365.25 / 12));
  const entitled = Math.round((issuesPerYear * months) / 12);
  const tracked =
    delivered.get(`${invoice.id}:${recipientId}:${period.from}`) ?? 0;
  const presumed = historicIssues.filter(day => inPeriod(day, period)).length;

  return { delivered: tracked + presumed, entitled };
}
