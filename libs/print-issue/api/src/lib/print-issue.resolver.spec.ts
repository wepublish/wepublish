import type { UserSession } from '@wepublish/authentication/api';
import type { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { PrintIssueResolver } from './print-issue.resolver';
import type { PrintIssueService } from './print-issue.service';

const session = { user: { id: 'editor-1' } } as unknown as UserSession;
const computedAt = new Date('2026-12-20T09:00:00.000Z');
const run = {
  mode: 'export',
  deliveryId: null,
  batch: 0,
  computedAt,
  computedBy: { id: 'editor-1', name: 'Muster', firstName: 'Maria' },
  rows: [],
  summary: { byPlan: { Jahresabo: 2 }, byKind: {}, byCountry: {} },
  filename: 'druckliste-1.27-2027-01-15.csv',
};
const issue = {
  id: 'issue-1',
  number: 1,
  year: 2027,
  issueDate: new Date('2027-01-15T00:00:00.000Z'),
  options: {},
  deliveries: [],
};
const defaults = {
  memberPlanIds: ['plan-a'],
  includeBexio: false,
  includeOpen: true,
  includeUpcoming: false,
};

const makeResolver = () => {
  const issues = {
    computeRun: vi.fn(async () => run),
    storedRun: vi.fn(async () => run),
    exportRun: vi.fn(async () => issue),
    deliver: vi.fn(async () => issue),
    deleteDelivery: vi.fn(async () => issue),
    close: vi.fn(async () => issue),
    reopen: vi.fn(async () => issue),
    duplicate: vi.fn(async () => issue),
    csv: vi.fn(async () => ({ filename: 'x.csv', csv: '' })),
    defaults: vi.fn(async () => defaults),
    bexioKinds: vi.fn(async () => [
      {
        id: 'gift',
        label: 'Geschenkabo',
        word: 'NW Geschenkabo',
        refersTo: 'period',
      },
    ]),
  };
  const bexioSource = { configured: vi.fn(async () => true) };
  const resolver = new PrintIssueResolver(
    issues as unknown as PrintIssueService,
    bexioSource as unknown as BexioPrintSourceService
  );

  return { resolver, issues, bexioSource };
};

describe('PrintIssueResolver', () => {
  it('computes the run as the signed-in user and maps the summary counts', async () => {
    const { resolver, issues } = makeResolver();

    const result = await resolver.computePrintIssueRun('issue-1', session);

    expect(issues.computeRun).toHaveBeenCalledWith('issue-1', 'editor-1');
    expect(result).toMatchObject({
      mode: 'export',
      batch: 0,
      computedAt,
      summary: { byPlan: [{ key: 'Jahresabo', count: 2 }] },
    });
  });

  it('answers null when no run is waiting', async () => {
    const { resolver, issues } = makeResolver();
    issues.storedRun.mockResolvedValue(null as never);

    expect(await resolver.printIssueRun('issue-1')).toBeNull();
  });

  it('exports with the computedAt the editor showed, as the signed-in user', async () => {
    const { resolver, issues } = makeResolver();

    const result = await resolver.exportPrintIssueRun(
      'issue-1',
      computedAt,
      session
    );

    expect(issues.exportRun).toHaveBeenCalledWith(
      'issue-1',
      'editor-1',
      computedAt
    );
    expect(result).toMatchObject({ label: '1.27', issueDate: '2027-01-15' });
  });

  it('hands over, deletes, closes, reopens and duplicates through the service', async () => {
    const { resolver, issues } = makeResolver();

    await resolver.deliverPrintIssueDelivery('del-0', session);
    await resolver.deletePrintIssueDelivery('del-0');
    await resolver.closePrintIssue('issue-1', session);
    await resolver.reopenPrintIssue('issue-1');
    await resolver.duplicatePrintIssue('issue-1');

    expect(issues.deliver).toHaveBeenCalledWith('del-0', 'editor-1');
    expect(issues.deleteDelivery).toHaveBeenCalledWith('del-0');
    expect(issues.close).toHaveBeenCalledWith('issue-1', 'editor-1');
    expect(issues.reopen).toHaveBeenCalledWith('issue-1');
    expect(issues.duplicate).toHaveBeenCalledWith('issue-1');
  });

  it('downloads one delivery or the merged list', async () => {
    const { resolver, issues } = makeResolver();

    await resolver.printIssueCsv('issue-1', 'del-1');
    await resolver.printIssueCsv('issue-1', null);

    expect(issues.csv).toHaveBeenNthCalledWith(1, 'issue-1', 'del-1');
    expect(issues.csv).toHaveBeenNthCalledWith(2, 'issue-1', null);
  });

  it("tells the editor what the options can do here and the medium's defaults", async () => {
    const { resolver, bexioSource } = makeResolver();
    bexioSource.configured.mockResolvedValue(false);

    expect(await resolver.printExportContext()).toEqual({
      bexioConfigured: false,
      defaults,
      // the medium's kinds, for the checkboxes of the options
      bexioKinds: [{ id: 'gift', label: 'Geschenkabo', refersTo: 'period' }],
    });
  });
});
