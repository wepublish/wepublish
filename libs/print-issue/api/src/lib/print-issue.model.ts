import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PrintIssueStatus } from '@prisma/client';
import { HasImageLc } from '@wepublish/image/api';
import type { ExportRow } from './csv/row';
import type { Summary } from './export/run';
import { DEFAULT_OPTIONS, type PrintExportOptions } from './options';
import type {
  PrintIssueDeliveryWithUsers,
  PrintIssueFile,
  PrintIssueRunMode,
  PrintIssueRunView,
  PrintIssueWithDeliveries,
} from './print-issue.service';
import { dbDateToYmd } from './rules/dates';
import { issueLabel } from './rules/issue';

export const PrintIssueRunModeEnum = {
  export: 'export',
  replace: 'replace',
  supplement: 'supplement',
} as const satisfies Record<PrintIssueRunMode, PrintIssueRunMode>;

registerEnumType(PrintIssueRunModeEnum, {
  name: 'PrintIssueRunMode',
  description:
    'What exporting the run does: export creates the first delivery; replace writes the delivery not handed over yet anew; supplement appends the next Nachlieferung.',
});

registerEnumType(PrintIssueStatus, {
  name: 'PrintIssueStatus',
  description:
    'open: lists can be computed, exported and handed over; closed: no more Nachlieferungen expected (reversible); historic: shipped before the export tracked issues (imported).',
});

@ObjectType()
export class PrintIssueUser {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  firstName!: string | null;
}

@ObjectType({ description: 'What a list is computed from.' })
export class PrintIssueOptions {
  @Field(() => [String], {
    nullable: true,
    description: 'Only these member plans; null = every subscription plan.',
  })
  memberPlanIds!: string[] | null;

  @Field({
    description:
      'Read bexio (institutions, gifts, bookshops, single issues) when a provider is configured.',
  })
  includeBexio!: boolean;

  @Field({
    description:
      'Renewing readers whose invoice is not paid yet stay in («offen»).',
  })
  includeOpen!: boolean;

  @Field({
    description:
      'Subscriptions starting after the ship day get a copy as a gift («Vorab-Exemplar»).',
  })
  includeUpcoming!: boolean;
}

@InputType({
  description:
    'Options to set; what is left out keeps its value (the defaults for a new issue).',
})
export class PrintIssueOptionsInput {
  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[] | null;

  @Field(() => Boolean, { nullable: true })
  includeBexio?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  includeOpen?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  includeUpcoming?: boolean | null;
}

@ObjectType()
export class PrintIssueCount {
  @Field()
  key!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class PrintIssueSources {
  @Field(() => Int)
  wepublish!: number;

  @Field(() => Int)
  bexio!: number;
}

@ObjectType({ description: 'Subscriptions the run left out, by reason.' })
export class PrintIssueSkipped {
  @Field(() => Int)
  donation!: number;

  @Field(() => Int, {
    description: "Plan not among the options' member plans.",
  })
  excludedPlan!: number;

  @Field(() => Int)
  future!: number;

  @Field(() => Int)
  unpaidDeactivation!: number;

  @Field(() => Int)
  replaced!: number;

  @Field(() => Int)
  deactivated!: number;

  @Field(() => Int)
  lapsed!: number;

  @Field(() => Int)
  exhausted!: number;

  @Field(() => Int, {
    description:
      "Plan sets 0 printed issues for the subscription's periodicity.",
  })
  noPrintIssues!: number;
}

@ObjectType()
export class PrintIssueBexioStats {
  @Field({ description: 'A bexio payment provider with an API key exists.' })
  configured!: boolean;

  @Field({ description: 'The options asked for bexio and it was read.' })
  included!: boolean;

  @Field(() => String, { nullable: true })
  path!: string | null;

  @Field(() => Int)
  invoicesInWindow!: number;

  @Field(() => Int)
  canceled!: number;

  @Field(() => Int)
  otherPeriod!: number;

  @Field(() => Int)
  einzelheftOhneAusgabe!: number;

  @Field(() => Int)
  skippedImported!: number;

  @Field(() => Int)
  skippedProvider!: number;

  @Field(() => Int)
  detailFetched!: number;

  @Field(() => Int)
  detailUnparsed!: number;

  @Field(() => Int)
  ungeprueft!: number;

  @Field(() => Int)
  zeroCopies!: number;

  @Field(() => Int)
  contactMissing!: number;
}

@ObjectType({ description: 'What one run of the export found.' })
export class PrintIssueSummary {
  @Field({ description: 'The issue, e.g. «1.27».' })
  issue!: string;

  @Field({
    description: 'The day the entitlement was evaluated at (YYYY-MM-DD).',
  })
  date!: string;

  @Field()
  includeUpcoming!: boolean;

  @Field(() => Int)
  rows!: number;

  @Field(() => Int)
  copies!: number;

  @Field(() => PrintIssueSources)
  bySource!: PrintIssueSources;

  @Field(() => [PrintIssueCount])
  byPlan!: PrintIssueCount[];

  @Field(() => [PrintIssueCount])
  byKind!: PrintIssueCount[];

  @Field(() => [PrintIssueCount])
  byCountry!: PrintIssueCount[];

  @Field(() => Int, {
    description: 'Rows marked «offen»: renewing, invoice not paid yet.',
  })
  unpaid!: number;

  @Field(() => Int, {
    description: 'Of those, rows without any renewal invoice yet.',
  })
  openWithoutInvoice!: number;

  @Field(() => Int, {
    description:
      'Rows marked «Restexemplar»: copies still owed to an ended period.',
  })
  grace!: number;

  @Field(() => Int, {
    description:
      'Rows marked «Vorab-Exemplar»: subscriptions starting after the ship day.',
  })
  gifts!: number;

  @Field(() => Int)
  kuendigungen!: number;

  @Field(() => Int)
  missingAddress!: number;

  @Field(() => Int)
  placeholderEmail!: number;

  @Field(() => Int)
  duplicates!: number;

  @Field(() => Int, {
    description:
      'Left out because another delivery of the issue exported them.',
  })
  alreadyExported!: number;

  @Field(() => Int)
  totalSubscriptions!: number;

  @Field(() => PrintIssueSkipped)
  skipped!: PrintIssueSkipped;

  @Field(() => PrintIssueBexioStats)
  bexio!: PrintIssueBexioStats;

  @Field(() => [String])
  warnings!: string[];
}

@ObjectType('PrintIssueDelivery', {
  description:
    "One list handed to the printshop: the export (batch 0) or a Nachlieferung. Until it is handed over it can be computed again and replaced, or deleted; from then on it is immutable and its copies count for the readers' quota.",
})
export class PrintIssueDeliveryModel {
  @Field()
  id!: string;

  @Field({ description: 'When the list was exported.' })
  createdAt!: Date;

  @Field(() => PrintIssueUser, { nullable: true })
  createdBy!: PrintIssueUser | null;

  @Field(() => Int, {
    description: '0 = the export, n = the n-th Nachlieferung.',
  })
  batch!: number;

  @Field(() => PrintIssueOptions, {
    description: 'The options this list was computed with.',
  })
  options!: PrintIssueOptions;

  @Field(() => Int)
  rowCount!: number;

  @Field(() => Int)
  copyCount!: number;

  @Field(() => PrintIssueSummary)
  summary!: PrintIssueSummary;

  @Field()
  filename!: string;

  @Field(() => Date, {
    nullable: true,
    description: '«übergeben»: when the file went to the printshop.',
  })
  deliveredAt!: Date | null;

  @Field(() => PrintIssueUser, { nullable: true })
  deliveredBy!: PrintIssueUser | null;
}

@ObjectType('PrintIssue', {
  description:
    'One printed issue of the magazine. Its lists are evaluated as of the ship day.',
  implements: () => [HasImageLc],
})
export class PrintIssueModel extends HasImageLc {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field(() => Int)
  number!: number;

  @Field(() => Int)
  year!: number;

  @Field({ description: '«1.27»' })
  label!: string;

  @Field({ description: 'Ship day, YYYY-MM-DD.' })
  issueDate!: string;

  @Field(() => PrintIssueStatus)
  status!: PrintIssueStatus;

  @Field(() => PrintIssueOptions)
  options!: PrintIssueOptions;

  @Field(() => String, { nullable: true })
  note!: string | null;

  @Field(() => Date, { nullable: true })
  closedAt!: Date | null;

  @Field(() => PrintIssueUser, { nullable: true })
  closedBy!: PrintIssueUser | null;

  @Field(() => [PrintIssueDeliveryModel], { description: 'In batch order.' })
  deliveries!: PrintIssueDeliveryModel[];
}

@InputType()
export class PrintIssueInputModel {
  @Field(() => Int)
  number!: number;

  @Field(() => Int)
  year!: number;

  @Field({ description: 'Ship day, YYYY-MM-DD.' })
  issueDate!: string;

  @Field(() => String, { nullable: true })
  note?: string | null;

  @Field(() => PrintIssueOptionsInput, {
    nullable: true,
    description:
      "Left out: a new issue takes the medium's defaults, an edited one keeps its own.",
  })
  options?: PrintIssueOptionsInput | null;

  @Field({
    defaultValue: false,
    description: 'Shipped before the export tracked issues.',
  })
  historic!: boolean;

  @Field(() => String, {
    nullable: true,
    description:
      'e.g. the cover. Left out: an edit keeps the image; null removes it.',
  })
  imageId?: string | null;
}

@ObjectType({
  description: 'One line of the print run: one address, `anzahl` copies.',
})
export class PrintIssueRow {
  @Field() quelle!: string;
  @Field() adressnummer!: string;
  @Field() anrede!: string;
  @Field() firma!: string;
  @Field() vorname!: string;
  @Field() name!: string;
  @Field() zusatz!: string;
  @Field() strasse!: string;
  @Field() hausnummer!: string;
  @Field() plz!: string;
  @Field() ort!: string;
  @Field() land!: string;
  @Field(() => Int) anzahl!: number;
  @Field() aboTyp!: string;
  @Field() zahlungsstatus!: string;
  @Field() beginn!: string;
  @Field() email!: string;
  @Field() bemerkungen!: string;
  @Field() hinweis!: string;
}

@ObjectType({
  description:
    'A computed list waiting to be checked. Exporting writes exactly these rows as a delivery.',
})
export class PrintIssueRun {
  @Field(() => PrintIssueRunModeEnum)
  mode!: PrintIssueRunMode;

  @Field(() => String, {
    nullable: true,
    description: 'The delivery a replace run writes anew.',
  })
  deliveryId!: string | null;

  @Field(() => Int, {
    description:
      'The batch the delivery gets: 0 = the export, n = the n-th Nachlieferung.',
  })
  batch!: number;

  @Field({
    description:
      'Pass it back when exporting: a run computed again in between is refused.',
  })
  computedAt!: Date;

  @Field(() => PrintIssueUser, { nullable: true })
  computedBy!: PrintIssueUser | null;

  @Field(() => [PrintIssueRow])
  rows!: PrintIssueRow[];

  @Field(() => PrintIssueSummary)
  summary!: PrintIssueSummary;

  @Field({ description: 'The CSV file name the delivery gets.' })
  filename!: string;
}

@ObjectType()
export class PrintIssueFileModel {
  @Field()
  filename!: string;

  @Field({ description: 'UTF-8 with BOM, «;» separated, CRLF.' })
  csv!: string;
}

@ObjectType({ description: 'What the options can do on this medium.' })
export class PrintExportContext {
  @Field({
    description:
      'A bexio payment provider with an API key exists; without it the bexio option has no effect.',
  })
  bexioConfigured!: boolean;

  @Field(() => PrintIssueOptions, {
    description:
      "The medium's defaults for a new issue (setting printExportDefaults).",
  })
  defaults!: PrintIssueOptions;
}

const counts = (
  record: Record<string, number> | undefined
): PrintIssueCount[] =>
  Object.entries(record ?? {}).map(([key, count]) => ({ key, count }));

/** Stored options as the API shows them; what an older row lacks comes from the defaults. */
const optionsOf = (raw: unknown): PrintExportOptions =>
  ({
    ...DEFAULT_OPTIONS,
    ...(typeof raw === 'object' && raw !== null ? raw : {}),
  }) as PrintExportOptions;

// a summary stored before a skip reason existed lacks its counter
const NO_SKIPS: PrintIssueSkipped = {
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

export const toSummaryModel = (summary: Summary): PrintIssueSummary => ({
  ...summary,
  skipped: { ...NO_SKIPS, ...summary.skipped },
  byPlan: counts(summary.byPlan),
  byKind: counts(summary.byKind),
  byCountry: counts(summary.byCountry),
});

export const toDeliveryModel = (
  delivery: PrintIssueDeliveryWithUsers
): PrintIssueDeliveryModel => ({
  ...delivery,
  options: optionsOf(delivery.options),
  summary: toSummaryModel(delivery.summary as unknown as Summary),
});

export const toPrintIssueModel = (
  issue: PrintIssueWithDeliveries
): PrintIssueModel => ({
  ...issue,
  label: issueLabel(issue),
  issueDate: dbDateToYmd(issue.issueDate),
  options: optionsOf(issue.options),
  deliveries: issue.deliveries.map(toDeliveryModel),
});

export const toRunModel = (run: PrintIssueRunView): PrintIssueRun => ({
  ...run,
  rows: run.rows as ExportRow[],
  summary: toSummaryModel(run.summary),
});

export const toFileModel = (file: PrintIssueFile): PrintIssueFileModel => file;
