import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrintIssueStatus,
  PrismaClient,
  type PrintIssue,
  type PrintIssueDelivery,
} from '@prisma/client';
import type { ExportRow } from './csv/row';
import { toCsv } from './csv/writer';
import type { ExportResult, RecipientDraft, Summary } from './export/run';
import {
  DEFAULT_OPTIONS,
  PRINT_EXPORT_DEFAULTS_SETTING,
  optionsFrom,
  sameOptions,
  type PrintExportOptions,
} from './options';
import { PrintIssueExportService } from './print-issue-export.service';
import { dbDateToYmd, isYmd, todayZurich, ymdToDbDate } from './rules/dates';
import { issueLabel } from './rules/issue';

export type PrintIssueInput = {
  number: number;
  year: number;
  /** YYYY-MM-DD */
  issueDate: string;
  note?: string | null;
  /** what is left out keeps its value: the medium's defaults for a new issue, its own for an edited one */
  options?: Partial<{
    [K in keyof PrintExportOptions]: PrintExportOptions[K] | null;
  }> | null;
  /** shipped before the export tracked issues */
  historic: boolean;
};

export type PrintIssueUserRef = {
  id: string;
  name: string;
  firstName: string | null;
};

export type PrintIssueDeliveryWithUsers = PrintIssueDelivery & {
  createdBy: PrintIssueUserRef | null;
  deliveredBy: PrintIssueUserRef | null;
};

/** An issue as lists and pages read it: with its deliveries, without the stored run (up to ~0.5 MB). */
export type PrintIssueWithDeliveries = Omit<PrintIssue, 'pendingRun'> & {
  closedBy: PrintIssueUserRef | null;
  deliveries: PrintIssueDeliveryWithUsers[];
};

/**
 * What exporting the computed list does, decided by the issue's state when it
 * is computed: `export` creates the first delivery, `replace` writes a
 * delivery that was not handed over yet anew, `supplement` appends the next
 * Nachlieferung after every delivery was handed over.
 */
export type PrintIssueRunMode = 'export' | 'replace' | 'supplement';

/** The computed list waiting to be checked and exported (`PrintIssue.pendingRun`). */
export type StoredRun = {
  mode: PrintIssueRunMode;
  /** the delivery a `replace` run writes into */
  deliveryId: string | null;
  /** the batch it becomes: 0 = the export, n = the n-th Nachlieferung */
  batch: number;
  options: PrintExportOptions;
  recipients: RecipientDraft[];
  summary: Summary;
  filename: string;
};

export type PrintIssueRunView = {
  mode: PrintIssueRunMode;
  deliveryId: string | null;
  batch: number;
  computedAt: Date;
  computedBy: PrintIssueUserRef | null;
  rows: ExportRow[];
  summary: Summary;
  filename: string;
};

export { DEFAULT_OPTIONS, optionsFrom, type PrintExportOptions };

/** A run older than this must be computed again before it is exported. */
export const RUN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PrintIssueFile = { filename: string; csv: string };

const USER_SELECT = {
  select: { id: true, name: true, firstName: true },
} as const;

const INCLUDE = {
  closedBy: USER_SELECT,
  deliveries: {
    orderBy: { batch: 'asc' },
    include: { createdBy: USER_SELECT, deliveredBy: USER_SELECT },
  },
} as const;

/** The stored run is up to ~0.5 MB per issue: only the run operations read it. */
const OMIT_RUN = { pendingRun: true } as const;

const CLEAR_RUN = {
  pendingRun: Prisma.DbNull,
  pendingRunAt: null,
  pendingRunByUserId: null,
};

/** createMany in chunks: a run has ~1,300 rows, a large medium many more */
export const RECIPIENT_CHUNK = 500;

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const fileBase = (issue: Pick<PrintIssue, 'number' | 'year' | 'issueDate'>) =>
  `druckliste-${issueLabel(issue)}-${dbDateToYmd(issue.issueDate)}`;

const chunked = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

const newestDelivery = <T extends { batch: number }>(
  deliveries: T[]
): T | null =>
  deliveries.reduce<T | null>(
    (latest, delivery) =>
      !latest || delivery.batch > latest.batch ? delivery : latest,
    null
  );

@Injectable()
export class PrintIssueService {
  constructor(
    private prisma: PrismaClient,
    private exporter: PrintIssueExportService
  ) {}

  list(): Promise<PrintIssueWithDeliveries[]> {
    return this.prisma.printIssue.findMany({
      orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
      include: INCLUDE,
      omit: OMIT_RUN,
    });
  }

  async findById(id: string): Promise<PrintIssueWithDeliveries> {
    const issue = await this.prisma.printIssue.findUnique({
      where: { id },
      include: INCLUDE,
      omit: OMIT_RUN,
    });

    if (!issue) {
      throw new NotFoundException(`Print issue <${id}> not found.`);
    }

    return issue;
  }

  /** The medium's defaults for a new issue (setting `printExportDefaults`). */
  async defaults(): Promise<PrintExportOptions> {
    const setting = await this.prisma.setting.findUnique({
      where: { name: PRINT_EXPORT_DEFAULTS_SETTING },
    });

    try {
      return optionsFrom(setting?.value);
    } catch (error) {
      throw new BadRequestException(
        `The setting ${PRINT_EXPORT_DEFAULTS_SETTING} is invalid: ${(error as Error).message}`
      );
    }
  }

  async create(input: PrintIssueInput): Promise<PrintIssueWithDeliveries> {
    const data = this.data(input);
    const options = optionsFrom(input.options, await this.defaults());

    try {
      return await this.prisma.printIssue.create({
        data: { ...data, options },
        include: INCLUDE,
      });
    } catch (error) {
      throw this.conflictOf(error, input);
    }
  }

  async update(
    id: string,
    input: PrintIssueInput
  ): Promise<PrintIssueWithDeliveries> {
    const existing = await this.findById(id);
    const data = this.data(input);
    const current = optionsFrom(existing.options);
    const options = optionsFrom(input.options, current);
    const changed =
      data.issueDate.getTime() !== existing.issueDate.getTime() ||
      !sameOptions(options, current);

    try {
      return await this.prisma.printIssue.update({
        where: { id },
        data: {
          ...data,
          options,
          // the status comes from creating (historic: by the importer),
          // closing and reopening, never from an edit
          status: existing.status,
          // a list computed for another ship day or other options must not be exported
          ...(changed ? CLEAR_RUN : {}),
        },
        include: INCLUDE,
      });
    } catch (error) {
      throw this.conflictOf(error, input);
    }
  }

  async delete(id: string): Promise<PrintIssueWithDeliveries> {
    const issue = await this.findById(id);

    if (issue.deliveries.some(delivery => delivery.deliveredAt)) {
      throw new BadRequestException(
        'A list of this issue was handed to the printshop; the issue is the record of it and cannot be deleted.'
      );
    }

    await this.prisma.printIssue.delete({ where: { id } });

    return issue;
  }

  /**
   * The next issue of the same year with the same options. It keeps the
   * ship day of the original until it is edited: a ship day is required.
   */
  async duplicate(id: string): Promise<PrintIssueWithDeliveries> {
    const source = await this.findById(id);
    const latest = await this.prisma.printIssue.findMany({
      where: { year: source.year },
      orderBy: { number: 'desc' },
      take: 1,
      select: { number: true },
    });
    const number = Math.max(0, ...latest.map(issue => issue.number)) + 1;

    try {
      return await this.prisma.printIssue.create({
        data: {
          number,
          year: source.year,
          issueDate: source.issueDate,
          status: PrintIssueStatus.open,
          note: null,
          options: optionsFrom(source.options),
        },
        include: INCLUDE,
      });
    } catch (error) {
      throw this.conflictOf(error, { number, year: source.year });
    }
  }

  /**
   * Computes the list and stores it on the issue for checking. What
   * exporting it will do follows from the state: the first delivery, a
   * delivery not handed over yet written anew, or the next Nachlieferung.
   * A new computation replaces the stored one.
   */
  async computeRun(id: string, userId: string): Promise<PrintIssueRunView> {
    const issue = await this.findById(id);
    const next = this.nextRun(issue);
    const options = optionsFrom(issue.options);
    const result =
      next.batch === 0 ?
        await this.exporter.compute(issue, { options })
      : await this.computeLater(issue, options, next);
    const run: StoredRun = {
      ...next,
      options,
      recipients: result.recipients,
      summary: result.summary,
      filename: result.filename,
    };
    const computedAt = new Date();

    await this.prisma.printIssue.update({
      where: { id },
      data: {
        pendingRun: run as unknown as Prisma.InputJsonValue,
        pendingRunAt: computedAt,
        pendingRunByUserId: userId,
      },
      select: { id: true },
    });

    return this.view(run, computedAt, null);
  }

  /** The stored run for the check step; null when none is waiting. */
  async storedRun(id: string): Promise<PrintIssueRunView | null> {
    const issue = await this.withRun(id);

    if (!issue.pendingRun || !issue.pendingRunAt) {
      return null;
    }

    return this.view(
      issue.pendingRun as unknown as StoredRun,
      issue.pendingRunAt,
      issue.pendingRunBy
    );
  }

  /**
   * Writes exactly the checked run as a delivery with its rows, in one
   * transaction, and drops the run. Refuses a run the editor did not show
   * (`computedAt`), a stale one, and one whose mode the state no longer
   * allows, e.g. a `replace` of a delivery handed over in the meantime.
   */
  async exportRun(
    id: string,
    userId: string,
    computedAt: Date
  ): Promise<PrintIssueWithDeliveries> {
    const issue = await this.withRun(id);

    if (issue.status !== PrintIssueStatus.open) {
      throw new BadRequestException(
        issue.status === PrintIssueStatus.closed ?
          'The issue is closed; reopen it to export a Nachlieferung.'
        : 'A historic issue has no export.'
      );
    }

    const run = this.checkedRun(issue, computedAt);

    this.checkMode(issue, run);

    if (run.mode === 'supplement' && run.recipients.length === 0) {
      // nobody new: nothing to hand over, the check is done
      await this.prisma.printIssue.updateMany({
        where: { id, pendingRunAt: computedAt },
        data: CLEAR_RUN,
      });

      return this.findById(id);
    }

    const now = new Date();

    await this.prisma.$transaction(async tx => {
      const deliveryId =
        run.mode === 'replace' ?
          await this.replaceDelivery(tx, run, userId, now)
        : await this.createDelivery(tx, issue, run, userId);

      await this.storeRecipients(tx, id, deliveryId, run.batch, run.recipients);

      const { count } = await tx.printIssue.updateMany({
        where: { id, pendingRunAt: computedAt },
        data: CLEAR_RUN,
      });

      if (count !== 1) {
        throw new ConflictException(
          'The list was computed again in the meantime; check the new one.'
        );
      }
    });

    return this.findById(id);
  }

  /** «übergeben»: the file went to the printshop. Never undone. */
  async deliver(
    deliveryId: string,
    userId: string
  ): Promise<PrintIssueWithDeliveries> {
    const delivery = await this.delivery(deliveryId);
    const { count } = await this.prisma.printIssueDelivery.updateMany({
      where: { id: deliveryId, deliveredAt: null },
      data: { deliveredAt: new Date(), deliveredByUserId: userId },
    });

    if (count !== 1) {
      throw new ConflictException(
        'This delivery was handed to the printshop already.'
      );
    }

    // a list computed to replace this delivery is moot now
    await this.clearRun(delivery.issueId);

    return this.findById(delivery.issueId);
  }

  async deleteDelivery(deliveryId: string): Promise<PrintIssueWithDeliveries> {
    const delivery = await this.delivery(deliveryId);

    if (delivery.deliveredAt) {
      throw new BadRequestException(
        'A delivery handed to the printshop is the record of what it received and cannot be deleted.'
      );
    }

    await this.prisma.$transaction(async tx => {
      await tx.printIssueDelivery.delete({ where: { id: deliveryId } });
      // a list computed to replace this delivery is moot now
      await this.clearRun(delivery.issueId, tx);
    });

    return this.findById(delivery.issueId);
  }

  /** No more Nachlieferungen expected. Reversible with `reopen`. */
  async close(id: string, userId: string): Promise<PrintIssueWithDeliveries> {
    const issue = await this.findById(id);

    if (issue.status !== PrintIssueStatus.open) {
      throw new BadRequestException(
        issue.status === PrintIssueStatus.closed ?
          'The issue is closed already.'
        : 'A historic issue is neither open nor closed.'
      );
    }

    if (issue.deliveries.length === 0) {
      throw new BadRequestException(
        'Nothing was exported yet; an issue is closed once its lists went to the printshop.'
      );
    }

    if (issue.deliveries.some(delivery => !delivery.deliveredAt)) {
      throw new BadRequestException(
        'Every delivery must be handed to the printshop before the issue is closed.'
      );
    }

    return this.prisma.printIssue.update({
      where: { id },
      data: {
        status: PrintIssueStatus.closed,
        closedAt: new Date(),
        closedByUserId: userId,
      },
      include: INCLUDE,
    });
  }

  async reopen(id: string): Promise<PrintIssueWithDeliveries> {
    const issue = await this.findById(id);

    if (issue.status !== PrintIssueStatus.closed) {
      throw new BadRequestException('Only a closed issue can be reopened.');
    }

    return this.prisma.printIssue.update({
      where: { id },
      data: {
        status: PrintIssueStatus.open,
        closedAt: null,
        closedByUserId: null,
      },
      include: INCLUDE,
    });
  }

  /** The CSV the printshop gets: one delivery, or every delivery merged in export order. */
  async csv(id: string, deliveryId?: string | null): Promise<PrintIssueFile> {
    const issue = await this.findById(id);

    if (issue.deliveries.length === 0) {
      throw new BadRequestException(
        'Nothing was exported yet; the CSV exists once a list is exported.'
      );
    }

    let filename = `${fileBase(issue)}-gesamt.csv`;

    if (deliveryId) {
      const delivery = issue.deliveries.find(entry => entry.id === deliveryId);

      if (!delivery) {
        throw new NotFoundException(
          `Delivery <${deliveryId}> not found on issue <${id}>.`
        );
      }

      filename = delivery.filename;
    }

    const recipients = await this.prisma.printIssueRecipient.findMany({
      where: { issueId: id, ...(deliveryId ? { deliveryId } : {}) },
      orderBy: [{ batch: 'asc' }, { position: 'asc' }],
      select: { batch: true, position: true, snapshot: true },
    });

    return {
      filename,
      csv: toCsv(
        recipients.map(recipient => recipient.snapshot as unknown as ExportRow)
      ),
    };
  }

  /** What exporting the next computed list does, from the issue's state. */
  private nextRun(
    issue: PrintIssueWithDeliveries
  ): Pick<StoredRun, 'mode' | 'deliveryId' | 'batch'> {
    if (issue.status === PrintIssueStatus.historic) {
      throw new BadRequestException(
        'A historic issue was shipped before the export tracked issues; there is no list to compute.'
      );
    }

    if (issue.status === PrintIssueStatus.closed) {
      throw new BadRequestException(
        'The issue is closed; reopen it to compute a Nachlieferung.'
      );
    }

    const newest = newestDelivery(issue.deliveries);

    if (!newest) {
      return { mode: 'export', deliveryId: null, batch: 0 };
    }

    if (!newest.deliveredAt) {
      return { mode: 'replace', deliveryId: newest.id, batch: newest.batch };
    }

    return { mode: 'supplement', deliveryId: null, batch: newest.batch + 1 };
  }

  /**
   * A list after the first delivery: only addresses no other delivery of the
   * issue has, evaluated as of today once the ship day has passed, every row
   * marked «Nachlieferung n» already when computed — what is checked is what
   * is exported.
   */
  private async computeLater(
    issue: PrintIssueWithDeliveries,
    options: PrintExportOptions,
    { deliveryId, batch }: Pick<StoredRun, 'deliveryId' | 'batch'>
  ): Promise<ExportResult> {
    const recorded = await this.prisma.printIssueRecipient.findMany({
      // the rows of the delivery being replaced do not count as exported
      where:
        deliveryId ?
          { issueId: issue.id, deliveryId: { not: deliveryId } }
        : { issueId: issue.id },
      select: { subscriptionId: true, bexioInvoiceId: true },
    });
    const shipDay = dbDateToYmd(issue.issueDate);
    const today = todayZurich();
    const result = await this.exporter.compute(issue, {
      options,
      // a reader who joined after the export gets the current issue; before
      // the ship day it is still the ship day that decides
      evaluateAt: today > shipDay ? today : shipDay,
      excludeSubscriptionIds: recorded
        .map(row => row.subscriptionId)
        .filter((value): value is string => value !== null),
      excludeBexioInvoiceIds: recorded
        .map(row => row.bexioInvoiceId)
        .filter((value): value is number => value !== null),
    });
    const marker = `Nachlieferung ${batch}`;

    return {
      ...result,
      recipients: result.recipients.map(recipient => ({
        ...recipient,
        snapshot: {
          ...recipient.snapshot,
          hinweis:
            recipient.snapshot.hinweis ?
              `${recipient.snapshot.hinweis}; ${marker}`
            : marker,
        },
      })),
      filename: `${fileBase(issue)}-nachlieferung-${batch}.csv`,
    };
  }

  private async withRun(id: string) {
    const issue = await this.prisma.printIssue.findUnique({
      where: { id },
      include: { ...INCLUDE, pendingRunBy: USER_SELECT },
    });

    if (!issue) {
      throw new NotFoundException(`Print issue <${id}> not found.`);
    }

    return issue;
  }

  private async delivery(id: string): Promise<PrintIssueDelivery> {
    const delivery = await this.prisma.printIssueDelivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery <${id}> not found.`);
    }

    return delivery;
  }

  /** The stored run, if it is the one the editor showed and still fresh. */
  private checkedRun(issue: PrintIssue, computedAt: Date): StoredRun {
    if (!issue.pendingRun || !issue.pendingRunAt) {
      throw new BadRequestException('Compute the list first, then check it.');
    }

    if (issue.pendingRunAt.getTime() !== computedAt.getTime()) {
      throw new ConflictException(
        'The list was computed again in the meantime; check the new one.'
      );
    }

    if (Date.now() - issue.pendingRunAt.getTime() > RUN_MAX_AGE_MS) {
      throw new ConflictException(
        'The list is older than 24 hours; compute it again before exporting it.'
      );
    }

    return issue.pendingRun as unknown as StoredRun;
  }

  /** The state may have moved on since the run was computed; its mode must still hold. */
  private checkMode(issue: PrintIssueWithDeliveries, run: StoredRun) {
    const newest = newestDelivery(issue.deliveries);

    switch (run.mode) {
      case 'export':
        if (newest) {
          throw new ConflictException(
            'The issue was exported in the meantime; compute the list again.'
          );
        }

        return;
      case 'replace': {
        const target = issue.deliveries.find(
          delivery => delivery.id === run.deliveryId
        );

        if (!target) {
          throw new ConflictException(
            'The delivery this list replaces was deleted in the meantime; compute the list again.'
          );
        }

        if (target.deliveredAt) {
          throw new ConflictException(
            'The delivery this list replaces was handed to the printshop in the meantime; compute the list again as a Nachlieferung.'
          );
        }

        return;
      }
      case 'supplement':
        if (
          !newest ||
          newest.batch + 1 !== run.batch ||
          issue.deliveries.some(delivery => !delivery.deliveredAt)
        ) {
          throw new ConflictException(
            'The deliveries changed since this list was computed; compute it again.'
          );
        }

        return;
    }
  }

  private async createDelivery(
    tx: Prisma.TransactionClient,
    issue: Pick<PrintIssue, 'id'>,
    run: StoredRun,
    userId: string
  ): Promise<string> {
    try {
      const delivery = await tx.printIssueDelivery.create({
        data: {
          issueId: issue.id,
          batch: run.batch,
          createdByUserId: userId,
          options: run.options as unknown as Prisma.InputJsonValue,
          rowCount: run.recipients.length,
          copyCount: run.summary.copies,
          summary: run.summary as unknown as Prisma.InputJsonValue,
          filename: run.filename,
        },
      });

      return delivery.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Another delivery took this batch in the meantime; compute the list again.'
        );
      }

      throw error;
    }
  }

  /** Writes a delivery not handed over yet anew: its rows go, the row keeps its batch. */
  private async replaceDelivery(
    tx: Prisma.TransactionClient,
    run: StoredRun,
    userId: string,
    now: Date
  ): Promise<string> {
    const deliveryId = run.deliveryId;

    if (!deliveryId) {
      throw new BadRequestException(
        'The stored run names no delivery to replace.'
      );
    }

    const { count } = await tx.printIssueDelivery.updateMany({
      where: { id: deliveryId, deliveredAt: null },
      data: {
        createdAt: now,
        createdByUserId: userId,
        options: run.options as unknown as Prisma.InputJsonValue,
        rowCount: run.recipients.length,
        copyCount: run.summary.copies,
        summary: run.summary as unknown as Prisma.InputJsonValue,
        filename: run.filename,
      },
    });

    if (count !== 1) {
      throw new ConflictException(
        'The delivery was handed to the printshop in the meantime; compute the list again as a Nachlieferung.'
      );
    }

    await tx.printIssueRecipient.deleteMany({ where: { deliveryId } });

    return deliveryId;
  }

  private async storeRecipients(
    tx: Prisma.TransactionClient,
    issueId: string,
    deliveryId: string,
    batch: number,
    recipients: RecipientDraft[]
  ) {
    const rows = recipients.map((recipient, position) => ({
      issueId,
      deliveryId,
      batch,
      position,
      ...recipient,
      snapshot: recipient.snapshot as unknown as Prisma.InputJsonValue,
    }));

    for (const chunk of chunked(rows, RECIPIENT_CHUNK)) {
      await tx.printIssueRecipient.createMany({ data: chunk });
    }
  }

  private clearRun(
    issueId: string,
    tx: Prisma.TransactionClient = this.prisma
  ) {
    return tx.printIssue.update({
      where: { id: issueId },
      data: CLEAR_RUN,
      select: { id: true },
    });
  }

  private view(
    run: StoredRun,
    computedAt: Date,
    computedBy: PrintIssueUserRef | null
  ): PrintIssueRunView {
    return {
      mode: run.mode,
      deliveryId: run.deliveryId,
      batch: run.batch,
      computedAt,
      computedBy,
      rows: run.recipients.map(recipient => recipient.snapshot),
      summary: run.summary,
      filename: run.filename,
    };
  }

  private data(input: PrintIssueInput) {
    if (!Number.isInteger(input.number) || input.number < 1) {
      throw new BadRequestException('The issue number must be 1 or more.');
    }

    if (
      !Number.isInteger(input.year) ||
      input.year < MIN_YEAR ||
      input.year > MAX_YEAR
    ) {
      throw new BadRequestException(
        `The year must lie between ${MIN_YEAR} and ${MAX_YEAR}.`
      );
    }

    if (!isYmd(input.issueDate)) {
      throw new BadRequestException(
        'The ship day must be a calendar day (YYYY-MM-DD).'
      );
    }

    return {
      number: input.number,
      year: input.year,
      issueDate: ymdToDbDate(input.issueDate),
      status:
        input.historic ? PrintIssueStatus.historic : PrintIssueStatus.open,
      note: input.note ?? null,
    };
  }

  private conflictOf(
    error: unknown,
    issue: { number: number; year: number }
  ): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `Issue ${issueLabel(issue)} exists already.`
      );
    }

    return error;
  }
}
