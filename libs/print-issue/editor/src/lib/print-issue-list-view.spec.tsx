import '@testing-library/jest-dom/vitest';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PrintIssueListView } from './print-issue-list-view';
import {
  context,
  delivery,
  issue,
  operationName,
  options,
  renderWithRouter,
  storedRun,
  summary,
  user,
} from './test-utils';

const queries: Record<string, () => unknown> = {};
const mutations: Record<string, ReturnType<typeof vi.fn>> = {};
const csvQuery = vi.fn();
const downloadCsv = vi.fn();

vi.mock('./download-csv', () => ({
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown) =>
    queries[operationName(document)]?.() ?? {
      data: undefined,
      loading: false,
      refetch: vi.fn(),
    },
  useMutation: (document: unknown) => {
    const name = operationName(document);
    mutations[name] ??= vi.fn(async () => ({ data: {} }));

    return [mutations[name], { loading: false }];
  },
  // Apollo Client 4: no onCompleted/onError, the trigger resolves with the result
  useLazyQuery: () => [
    (options: unknown) => Promise.resolve({ data: csvQuery(options) }),
    { loading: false },
  ],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  InfoTooltip: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

const renderView = () =>
  renderWithRouter(
    <Routes>
      <Route
        path="/print-issues/:id/list"
        element={<PrintIssueListView />}
      />
    </Routes>,
    '/print-issues/issue-1/list'
  );

// Like Apollo, a query answers with the same objects on every render.
const stable = (name: string, data: unknown) => {
  const result = { data, loading: false, refetch: vi.fn() };
  queries[name] = vi.fn(() => result);
};
const withIssue = (overrides: Record<string, unknown> = {}) =>
  stable('PrintIssueById', { printIssue: issue(overrides) });
const withRun = (run: unknown) =>
  stable('PrintIssueRun', { printIssueRun: run });
const withContext = (overrides: Record<string, unknown> = {}) =>
  stable('PrintExportContext', { printExportContext: context(overrides) });

const handedOver = {
  deliveredAt: '2026-12-21T09:00:00.000Z',
  deliveredBy: user,
};
const toggle = (name: string) => screen.getByRole('switch', { name });

beforeEach(() => {
  vi.clearAllMocks();
  for (const record of [queries, mutations]) {
    for (const key of Object.keys(record)) {
      delete record[key];
    }
  }
  withContext();
  withRun(null);
  csvQuery.mockImplementation(
    ({ variables }: { variables: { deliveryId?: string | null } }) => ({
      printIssueCsv: {
        csv: `csv-${variables.deliveryId ?? 'all'}`,
        filename: `file-${variables.deliveryId ?? 'all'}.csv`,
      },
    })
  );
});

describe('PrintIssueListView', () => {
  describe('an open issue without deliveries', () => {
    beforeEach(() => withIssue());

    it('offers the options and computing; nothing to export, hand over or download yet', () => {
      renderView();

      expect(
        screen.getByText('printIssues.listView.title {"label":"1.27"}')
      ).toBeInTheDocument();
      expect(toggle('printExportOptions.includeBexio')).toBeChecked();
      expect(toggle('printExportOptions.includeOpen')).toBeChecked();
      expect(toggle('printExportOptions.includeUpcoming')).not.toBeChecked();
      expect(
        screen.getByRole('button', { name: 'printIssues.compute' })
      ).toBeEnabled();
      expect(
        screen.getByRole('button', { name: 'printIssues.export' })
      ).toBeDisabled();
      expect(
        screen.getByText('printIssues.deliveries.empty')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'printIssues.deliveries.fullList' })
      ).toBeDisabled();
      expect(screen.getByText('printIssues.steps.export')).toBeInTheDocument();
    });

    it('disables bexio with a hint while no provider has a key', () => {
      withContext({ bexioConfigured: false });
      renderView();

      expect(toggle('printExportOptions.includeBexio')).toBeDisabled();
      expect(
        screen.getByText('printExportOptions.bexioNotConfigured')
      ).toBeInTheDocument();
    });

    it('saves changed options with the issue, and holds the export until they are saved', async () => {
      renderView();

      expect(
        screen.getByRole('button', { name: 'printIssues.options.save' })
      ).toBeDisabled();
      fireEvent.click(toggle('printExportOptions.includeUpcoming'));

      expect(
        screen.getByText('printIssues.options.unsaved')
      ).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.options.save' })
      );

      await waitFor(() =>
        expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              id: 'issue-1',
              input: {
                number: 1,
                year: 2027,
                issueDate: '2027-01-15',
                note: null,
                historic: false,
                options: options({ includeUpcoming: true }),
              },
            },
          })
        )
      );
    });

    it("resets the options to the medium's defaults", () => {
      withContext({
        defaults: options({ includeBexio: false, memberPlanIds: ['plan-a'] }),
      });
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.options.reset' })
      );

      expect(toggle('printExportOptions.includeBexio')).not.toBeChecked();
      // the plan picker has no plans to name here, so it shows the picked id
      expect(screen.getByText('plan-a')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'printIssues.options.save' })
      ).toBeEnabled();
    });

    it('saves unsaved options before computing, so the list uses them', async () => {
      renderView();

      fireEvent.click(toggle('printExportOptions.includeOpen'));
      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.compute' })
      );

      await waitFor(() =>
        expect(mutations['ComputePrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1' },
        })
      );
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              options: options({ includeOpen: false }),
            }),
          }),
        })
      );
      expect(
        mutations['UpdatePrintIssue']!.mock.invocationCallOrder[0]
      ).toBeLessThan(
        mutations['ComputePrintIssueRun']!.mock.invocationCallOrder[0]!
      );
    });

    it('shows the computed list with who computed it, and its addresses in an overlay', async () => {
      withRun(storedRun());
      renderView();

      expect(
        screen.getByText(/printIssues\.computedLine .*"name":"Maria Muster"/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/printIssues\.summary\.headline/)
      ).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.showList {"count":2}' })
      );

      const overlay = await screen.findByRole('dialog');
      expect(overlay).toHaveTextContent('Alpha');
      expect(overlay).toHaveTextContent('Beta');
    });

    it('exports exactly the checked list after a confirmation that names the export, and downloads nothing', async () => {
      withRun(storedRun());
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.export' })
      );
      expect(mutations['ExportPrintIssueRun']).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          /printIssues\.exportQuestion\.export .*"addresses":2,"copies":2/
        )
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.exportConfirm.export' })
      );

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
      expect(downloadCsv).not.toHaveBeenCalled();
    });

    it('asks to compute again when the export is refused', async () => {
      withRun(storedRun());
      mutations['ExportPrintIssueRun'] = vi.fn(async () => {
        throw new Error(
          'The list was computed again in the meantime; check the new one.'
        );
      });
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.export' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.exportConfirm.export' })
      );

      expect(
        await screen.findByText('printIssues.runConflict')
      ).toBeInTheDocument();
    });
  });

  describe('an issue with a draft delivery', () => {
    beforeEach(() =>
      withIssue({
        deliveries: [
          delivery({
            options: options({
              memberPlanIds: ['plan-a', 'plan-b'],
              includeBexio: false,
            }),
          }),
        ],
      })
    );

    it('lists the draft with its options, CSV, hand-over and delete, and the merged list', async () => {
      renderView();

      const row = screen.getByRole('row', {
        name: /^printIssues\.deliveries\.export\b/,
      });
      expect(row).toHaveTextContent('printIssues.deliveries.draft');
      expect(row).toHaveTextContent(
        'printExportOptions.plansCount {"count":2}'
      );
      expect(row).not.toHaveTextContent('printExportOptions.bexioShort');
      expect(row).toHaveTextContent('printExportOptions.openShort');
      expect(row).toHaveTextContent('100');
      expect(row).toHaveTextContent('102');

      fireEvent.click(
        within(row).getByRole('button', { name: 'printIssues.deliveries.csv' })
      );
      await waitFor(() =>
        expect(downloadCsv).toHaveBeenCalledWith('csv-del-0', 'file-del-0.csv')
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.deliveries.fullList' })
      );
      await waitFor(() =>
        expect(downloadCsv).toHaveBeenCalledWith('csv-all', 'file-all.csv')
      );
    });

    it('replaces the draft when exporting again, and says so', async () => {
      withRun(storedRun({ mode: 'replace', deliveryId: 'del-0' }));
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.export' })
      );
      expect(
        screen.getByText(
          /printIssues\.exportQuestion\.replace .*"date":"20.12.2026"/
        )
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'printIssues.exportConfirm.replace',
        })
      );

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
    });

    it('hands the delivery over after a confirmation', async () => {
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.deliveries.deliver' })
      );
      expect(mutations['DeliverPrintIssueDelivery']).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          /printIssues\.deliveries\.deliverQuestion .*"label":"1.27"/
        )
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'printIssues.deliveries.deliverConfirm',
        })
      );

      await waitFor(() =>
        expect(mutations['DeliverPrintIssueDelivery']).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'del-0' } })
        )
      );
    });

    it('deletes the draft after a confirmation', async () => {
      renderView();

      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.deliveries.delete' })
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: 'printIssues.deliveries.deleteConfirm',
        })
      );

      await waitFor(() =>
        expect(mutations['DeletePrintIssueDelivery']).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'del-0' } })
        )
      );
    });
  });

  describe('an issue whose deliveries are handed over', () => {
    beforeEach(() => withIssue({ deliveries: [delivery(handedOver)] }));

    it('shows the hand-over and offers neither hand-over nor delete for it', () => {
      renderView();

      expect(
        screen.getByText(
          'printIssues.deliveries.deliveredLine {"date":"21.12.2026","name":"Maria Muster"}'
        )
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'printIssues.deliveries.deliver' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'printIssues.deliveries.delete' })
      ).not.toBeInTheDocument();
    });

    it('exports the next list as a Nachlieferung', async () => {
      withRun(
        storedRun({
          mode: 'supplement',
          batch: 1,
          filename: 'druckliste-1.27-2027-01-15-nachlieferung-1.csv',
          rows: [
            {
              ...storedRun().rows[0],
              name: 'Late',
              hinweis: 'Nachlieferung 1',
            },
          ],
          summary: summary({ rows: 1, copies: 1 }),
        })
      );
      renderView();

      expect(
        screen.queryByRole('button', { name: 'printIssues.export' })
      ).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: 'printIssues.exportSupplement' })
      );
      expect(
        screen.getByText(/printIssues\.exportQuestion\.supplement .*"batch":1/)
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'printIssues.exportConfirm.supplement',
        })
      );

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
    });

    it('says when nobody new is entitled and offers nothing to export', () => {
      withRun(
        storedRun({
          mode: 'supplement',
          batch: 1,
          rows: [],
          summary: summary({ rows: 0, copies: 0 }),
        })
      );
      renderView();

      expect(
        screen.getByText('printIssues.supplementEmpty')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'printIssues.exportSupplement' })
      ).not.toBeInTheDocument();
    });
  });

  describe('a closed issue', () => {
    beforeEach(() =>
      withIssue({
        status: 'closed',
        closedAt: '2027-02-01T10:00:00.000Z',
        closedBy: user,
        deliveries: [delivery(handedOver)],
      })
    );

    it('explains that reopening comes first, computes nothing and locks the options', () => {
      renderView();

      expect(screen.getByText('printIssues.closedInfo')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'printIssues.compute' })
      ).not.toBeInTheDocument();
      expect(toggle('printExportOptions.includeOpen')).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'printIssues.deliveries.csv' })
      ).toBeEnabled();
    });
  });

  describe('an imported historic issue', () => {
    beforeEach(() =>
      withIssue({
        label: '6.26',
        number: 6,
        year: 2026,
        issueDate: '2026-10-14',
        status: 'historic',
      })
    );

    it('has neither options nor a list to compute', () => {
      renderView();

      expect(
        screen.getByText('printIssues.historicNoExport')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'printIssues.compute' })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });
});
