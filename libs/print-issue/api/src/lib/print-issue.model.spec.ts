import { toPrintIssueModel, toRunModel } from './print-issue.model';
import type {
  PrintIssueRunView,
  PrintIssueWithDeliveries,
} from './print-issue.service';

const options = {
  memberPlanIds: null,
  includeBexio: true,
  includeOpen: true,
  includeUpcoming: false,
};

const summary = {
  rows: 1,
  copies: 2,
  byPlan: { Jahresabo: 1 },
  byKind: {},
  byCountry: {},
};

const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: 'del-0',
  createdAt: new Date('2026-12-20T10:00:00.000Z'),
  issueId: 'issue-1',
  batch: 0,
  createdByUserId: 'u1',
  createdBy: { id: 'u1', name: 'Muster', firstName: 'Maria' },
  options,
  rowCount: 1,
  copyCount: 2,
  summary,
  filename: 'druckliste-1.27-2027-01-15.csv',
  deliveredAt: null,
  deliveredByUserId: null,
  deliveredBy: null,
  ...overrides,
});

const issue = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'issue-1',
    createdAt: new Date('2026-12-01T09:00:00.000Z'),
    modifiedAt: new Date('2026-12-21T09:00:00.000Z'),
    number: 1,
    year: 2027,
    issueDate: new Date('2027-01-15T00:00:00.000Z'),
    status: 'open',
    note: null,
    options,
    closedAt: null,
    closedByUserId: null,
    closedBy: null,
    pendingRunAt: null,
    pendingRunByUserId: null,
    deliveries: [],
    ...overrides,
  }) as unknown as PrintIssueWithDeliveries;

describe('toPrintIssueModel', () => {
  it('labels the issue, hands the ship day over as a calendar day and keeps the deliveries', () => {
    const model = toPrintIssueModel(
      issue({
        deliveries: [
          delivery(),
          delivery({
            id: 'del-1',
            batch: 1,
            deliveredAt: new Date('2027-01-05T08:00:00.000Z'),
            deliveredBy: { id: 'u2', name: 'Beispiel', firstName: null },
            options: { ...options, includeBexio: false },
          }),
        ],
      })
    );

    expect(model).toMatchObject({
      label: '1.27',
      issueDate: '2027-01-15',
      status: 'open',
      options,
      closedAt: null,
      closedBy: null,
    });
    expect(model.deliveries.map(entry => entry.batch)).toEqual([0, 1]);
    expect(model.deliveries[1]).toMatchObject({
      deliveredAt: new Date('2027-01-05T08:00:00.000Z'),
      deliveredBy: { name: 'Beispiel' },
      options: { includeBexio: false },
      summary: { copies: 2, byPlan: [{ key: 'Jahresabo', count: 1 }] },
    });
    expect(model).not.toHaveProperty('pendingRun');
  });

  it('fills what an older row lacks in its options with the defaults', () => {
    const model = toPrintIssueModel(
      issue({
        options: { includeBexio: false },
        deliveries: [delivery({ options: {} })],
      })
    );

    expect(model.options).toEqual({ ...options, includeBexio: false });
    expect(model.deliveries[0]!.options).toEqual(options);
  });

  it('shows who closed the issue and when', () => {
    const closedAt = new Date('2027-02-01T10:00:00.000Z');
    const model = toPrintIssueModel(
      issue({
        status: 'closed',
        closedAt,
        closedBy: { id: 'u1', name: 'Muster', firstName: 'Maria' },
      })
    );

    expect(model).toMatchObject({
      status: 'closed',
      closedAt,
      closedBy: { name: 'Muster' },
    });
  });
});

describe('toRunModel', () => {
  it('keeps what exporting the run will do and maps the summary counts', () => {
    const run: PrintIssueRunView = {
      mode: 'replace',
      deliveryId: 'del-0',
      batch: 0,
      computedAt: new Date('2026-12-20T09:00:00.000Z'),
      computedBy: null,
      rows: [],
      summary: summary as never,
      filename: 'druckliste-1.27-2027-01-15.csv',
    };

    expect(toRunModel(run)).toMatchObject({
      mode: 'replace',
      deliveryId: 'del-0',
      batch: 0,
      summary: { byPlan: [{ key: 'Jahresabo', count: 1 }] },
    });
  });
});
