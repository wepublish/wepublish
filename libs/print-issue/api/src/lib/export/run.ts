import type { BexioClient } from '../bexio/client';
import { contactToRow } from '../bexio/map';
import type { BexioKind } from '../bexio/parse';
import {
  type BexioTopUp,
  selectBexioOrders,
  type SelectStats,
} from '../bexio/select';
import { emptyRow, type ExportRow } from '../csv/row';
import { toCsv } from '../csv/writer';
import { subscriptionToRow } from '../members/map';
import type { MemberSource } from '../members/types';
import { markDuplicates } from '../rules/dedupe';
import {
  classifySubscription,
  resolveGifts,
  type ExclusionReason,
  type IncludeReason,
  type QuotaConfig,
} from '../rules/entitlement';
import { issueYear } from '../rules/issue';

export type ExportInput = {
  /** «6.26»; a double issue «3/4.26» */
  issue: string;
  /** how many issues it counts as against a reader's period: 2 for a double issue; default 1 */
  countsAs?: number;
  /** the Zurich calendar day the entitlement is evaluated at */
  date: string;
  /** subscriptions starting after `date` get a copy as a gift */
  includeUpcoming?: boolean;
  /** renewing readers with an unpaid invoice stay in; default true */
  includeOpen?: boolean;
  /** only these member plans; null = every subscription plan */
  memberPlanIds?: string[] | null;
  /** read bexio when a provider is configured; default true */
  includeBexio?: boolean;
  /** the bexio kinds the medium configured (setting `printBexioKinds`) */
  bexioKinds?: BexioKind[];
  /** only these configured kinds; null = every one */
  bexioKindIds?: string[] | null;
  /** the issue's ship day: bexio periods are matched against it, also when `date` is later */
  shipDay?: string;
  quota?: QuotaConfig;
  /** what earlier batches of the same issue already exported */
  excludeSubscriptionIds?: string[];
  /** `${invoiceId}:${recipientContactId}` of bexio rows already exported */
  excludeBexioRecipients?: string[];
  /** copies of delivered lists by `${invoiceId}:${recipientId}:${period.from}`, for bexio copies still owed */
  bexioDelivered?: Record<string, number>;
};

export type Sources = { members: MemberSource; bexio: BexioClient | null };
export type RunOptions = { detailMax?: number };

export type RecipientSource = 'wepublish' | 'bexio';
export type RecipientReason = IncludeReason | 'external';

/** One row of the run with the links finalize stores next to the snapshot. */
export type RecipientDraft = {
  source: RecipientSource;
  reason: RecipientReason;
  copies: number;
  userId: string | null;
  subscriptionId: string | null;
  periodId: string | null;
  bexioInvoiceId: number | null;
  /** the recipient's bexio contact */
  bexioContactId: number | null;
  /** the bexio period the copy belongs to, for copies still owed later */
  bexioPeriodFrom: string | null;
  bexioPeriodTo: string | null;
  snapshot: ExportRow;
};

export type BexioSummary = SelectStats & {
  /** a bexio payment provider with an API key exists */
  configured: boolean;
  /** the options asked for bexio and it was read */
  included: boolean;
  path: 'search' | 'list' | null;
  contactMissing: number;
};

export type Summary = {
  issue: string;
  date: string;
  includeUpcoming: boolean;
  rows: number;
  copies: number;
  bySource: { wepublish: number; bexio: number };
  byPlan: Record<string, number>;
  byKind: Record<string, number>;
  byCountry: Record<string, number>;
  unpaid: number;
  openWithoutInvoice: number;
  grace: number;
  gifts: number;
  kuendigungen: number;
  missingAddress: number;
  placeholderEmail: number;
  duplicates: number;
  alreadyExported: number;
  totalSubscriptions: number;
  skipped: Record<ExclusionReason, number>;
  bexio: BexioSummary;
  warnings: string[];
};

export type ExportResult = {
  rows: ExportRow[];
  recipients: RecipientDraft[];
  summary: Summary;
  filename: string;
  csv: string;
};

export const NO_KINDS_WARNING =
  'bexio: keine bexio-Bezugsarten konfiguriert (Einstellungen › Druckausgaben) – aus bexio wird nichts gelistet';

export const NO_BEXIO_WARNING =
  'bexio: kein Zahlungsanbieter mit API-Schlüssel konfiguriert – keine Institutionen, Geschenke, Buchhandel und Einzelhefte';

const count = (values: string[]): Record<string, number> => {
  const counts: Record<string, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }

  return counts;
};

const emptyStats = (): SelectStats => ({
  invoicesInWindow: 0,
  canceled: 0,
  skippedProvider: 0,
  skippedImported: 0,
  skippedOpen: 0,
  otherPeriod: 0,
  noValidPeriod: 0,
  excludedKind: 0,
  quantityMismatch: 0,
  detailFetched: 0,
  ungeprueft: 0,
  zeroCopies: 0,
});

type Pending = Omit<RecipientDraft, 'snapshot'> & { row: ExportRow };

export async function runExport(
  {
    issue,
    countsAs = 1,
    date,
    includeUpcoming = false,
    includeOpen = true,
    memberPlanIds = null,
    includeBexio = true,
    bexioKinds = [],
    bexioKindIds = null,
    shipDay,
    quota = { issuesPerYear: 0, historicIssues: [] },
    excludeSubscriptionIds = [],
    excludeBexioRecipients = [],
    bexioDelivered = {},
  }: ExportInput,
  { members, bexio }: Sources,
  { detailMax = 300 }: RunOptions = {}
): Promise<ExportResult> {
  const year = issueYear(issue);
  // The year in the invoice text decides, the date only narrows the search.
  // Most yearly invoices are written in the autumn before their year, but
  // gifts are paid years ahead (2026 gifts invoiced in January 2024).
  const window = { from: `${year - 5}-01-01`, to: `${year}-12-31` };

  const [loaded, external] = await Promise.all([
    members(),
    bexio && includeBexio ?
      loadBexio(bexio, {
        issue,
        shipDay: shipDay ?? date,
        kinds: bexioKinds,
        kindIds: bexioKindIds,
        includeOpen,
        detailMax,
        topUp: {
          issuesPerYear: quota.issuesPerYear,
          historicIssues: quota.historicIssues,
          countsAs,
          delivered: new Map(Object.entries(bexioDelivered)),
        },
        ...window,
      })
    : Promise.resolve(noBexio(bexio !== null)),
  ]);

  const skipped: Record<ExclusionReason, number> = {
    donation: 0,
    excludedPlan: 0,
    future: 0,
    unpaidDeactivation: 0,
    replaced: 0,
    deactivated: 0,
    lapsed: 0,
    exhausted: 0,
    noPrintIssues: 0,
  };
  const counters = {
    unpaid: 0,
    openWithoutInvoice: 0,
    grace: 0,
    gifts: 0,
    kuendigungen: 0,
    alreadyExported: 0,
  };
  const excludedSubscriptions = new Set(excludeSubscriptionIds);
  const excludedRecipients = new Set(excludeBexioRecipients);
  const ruleIssue = { issueDate: date, countsAs };

  const entries = resolveGifts(
    loaded.subscriptions
      .filter(subscription => {
        if (excludedSubscriptions.has(subscription.id)) {
          counters.alreadyExported++;

          return false;
        }

        return true;
      })
      .map(subscription => ({
        subscription,
        verdict: classifySubscription(subscription, ruleIssue, quota, {
          includeUpcoming,
          includeOpen,
          memberPlanIds,
        }),
      }))
  );

  const pending: Pending[] = [];

  for (const { subscription, verdict } of entries) {
    if (!verdict.include) {
      skipped[verdict.reason]++;
      continue;
    }

    if (verdict.unpaid) {
      counters.unpaid++;
    }

    if (verdict.openWithoutInvoice) {
      counters.openWithoutInvoice++;
    }

    if (verdict.reason === 'grace') {
      counters.grace++;
    }

    if (verdict.reason === 'gift') {
      counters.gifts++;
    }

    if (verdict.zahlungsstatus.startsWith('Kündigung')) {
      counters.kuendigungen++;
    }

    pending.push({
      source: 'wepublish',
      reason: verdict.reason,
      copies: 1,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      periodId: verdict.periodId,
      bexioInvoiceId: null,
      bexioContactId: null,
      bexioPeriodFrom: null,
      bexioPeriodTo: null,
      row: subscriptionToRow(
        subscription,
        loaded.users.get(subscription.userId),
        verdict
      ),
    });
  }

  const memberCount = pending.length;

  const listedKinds: string[] = [];

  for (const entry of external.entries) {
    if (excludedRecipients.has(`${entry.invoiceId}:${entry.contactId}`)) {
      counters.alreadyExported++;
      continue;
    }

    listedKinds.push(entry.kindLabel);

    if (entry.owed) {
      counters.grace++;
    }

    pending.push({
      source: 'bexio',
      reason: entry.owed ? 'grace' : 'external',
      copies: entry.row.anzahl,
      userId: null,
      subscriptionId: null,
      periodId: null,
      bexioInvoiceId: entry.invoiceId,
      bexioContactId: entry.contactId,
      bexioPeriodFrom: entry.period?.from ?? null,
      bexioPeriodTo: entry.period?.to ?? null,
      row: entry.row,
    });
  }

  const rows = markDuplicates(pending.map(entry => entry.row));
  const recipients: RecipientDraft[] = pending.map(
    ({ row: _row, ...draft }, index) => ({
      ...draft,
      snapshot: rows[index]!,
    })
  );
  const memberRows = rows.slice(0, memberCount);
  const bexioRows = rows.slice(memberCount);
  const warnings = [...loaded.warnings, ...external.warnings];

  if (memberRows.length > 0 && memberRows.every(row => !row.adressnummer)) {
    warnings.push(
      'Keine Adressnummern gefunden (nw_adressnummer) – Import prüfen'
    );
  }

  const summary: Summary = {
    issue,
    date,
    includeUpcoming,
    rows: rows.length,
    copies: rows.reduce((sum, row) => sum + row.anzahl, 0),
    bySource: { wepublish: memberRows.length, bexio: bexioRows.length },
    byPlan: count(memberRows.map(row => row.aboTyp)),
    byKind: count(listedKinds),
    byCountry: count(rows.map(row => row.land || '(leer)')),
    ...counters,
    missingAddress: rows.filter(row => row.hinweis.includes('Keine Adresse'))
      .length,
    placeholderEmail: rows.filter(row =>
      row.hinweis.includes('Platzhalter-E-Mail')
    ).length,
    duplicates: rows.filter(row => row.hinweis.includes('Doppelt')).length,
    totalSubscriptions: loaded.subscriptions.length,
    skipped,
    bexio: external.stats,
    warnings,
  };

  return {
    rows,
    recipients,
    summary,
    // «3/4.26» → «3-4.26»: no slash in a file name
    filename: `druckliste-${issue.replace('/', '-')}-${date}.csv`,
    csv: toCsv(rows),
  };
}

type ExternalEntry = {
  row: ExportRow;
  invoiceId: number;
  /** the recipient */
  contactId: number;
  kindLabel: string;
  period: { from: string; to: string } | null;
  /** a copy still owed after the period ended */
  owed: boolean;
};

type External = {
  entries: ExternalEntry[];
  stats: BexioSummary;
  warnings: string[];
};

/** bexio not read: because no provider is set up (a warning) or because the options left it out. */
const noBexio = (configured: boolean): External => ({
  entries: [],
  stats: {
    ...emptyStats(),
    configured,
    included: false,
    path: null,
    contactMissing: 0,
  },
  warnings: configured ? [] : [NO_BEXIO_WARNING],
});

async function loadBexio(
  bexio: BexioClient,
  {
    issue,
    shipDay,
    kinds,
    kindIds,
    includeOpen,
    detailMax,
    topUp,
    from,
    to,
  }: {
    issue: string;
    shipDay: string;
    kinds: BexioKind[];
    kindIds: string[] | null;
    includeOpen: boolean;
    detailMax: number;
    topUp: BexioTopUp;
    from: string;
    to: string;
  }
): Promise<External> {
  // links are only needed for subscriptions over a period
  const needsLinks = kinds.some(kind => kind.refersTo === 'period');
  const [{ invoices, path }, contacts, countries, salutations, links] =
    await Promise.all([
      bexio.invoicesInWindow(from, to),
      bexio.contacts(),
      bexio.countries(),
      bexio.salutations(),
      needsLinks ? bexio.contactLinks() : Promise.resolve(new Map()),
    ]);
  const { selected, stats, warnings } = await selectBexioOrders(invoices, {
    issue,
    shipDay,
    kinds,
    links,
    includeOpen,
    kindIds,
    fetchPositions: id => bexio.positions(id),
    topUp,
    detailMax,
  });

  let contactMissing = 0;
  const entries = selected.map((order): ExternalEntry => {
    const contact = contacts.get(order.recipientId);
    const ids = {
      invoiceId: order.invoice.id,
      contactId: order.recipientId,
      kindLabel: order.kind.label,
      period: order.period,
      owed: !!order.owed,
    };

    if (contact) {
      return {
        ...ids,
        row: contactToRow(
          contact,
          order,
          { countries, salutations },
          contacts.get(order.payerId)
        ),
      };
    }

    contactMissing++;

    return {
      ...ids,
      row: {
        ...emptyRow(),
        quelle: 'bexio',
        anzahl: order.copies,
        aboTyp:
          order.issue ? `${order.kind.label} ${order.issue}` : order.kind.label,
        hinweis: `bexio-Kontakt ${order.recipientId} fehlt`,
      },
    };
  });

  return {
    entries,
    stats: { ...stats, configured: true, included: true, path, contactMissing },
    warnings: [
      ...(kinds.length ? [] : [NO_KINDS_WARNING]),
      ...(path === 'list' ?
        [
          'bexio: Suche nach Rechnungsdatum nicht möglich, alle Rechnungen gelesen',
        ]
      : []),
      ...warnings,
    ],
  };
}
