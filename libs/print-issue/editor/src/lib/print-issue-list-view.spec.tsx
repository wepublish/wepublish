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
const withContext = (overrides: Record<string, unknown> = {}) =>
  stable('PrintExportContext', { printExportContext: context(overrides) });
/** computing answers with this run, as the API does */
const computes = (run: unknown) => {
  mutations['ComputePrintIssueRun'] = vi.fn(async () => ({
    data: { computePrintIssueRun: run },
  }));
};

const delivered = {
  deliveredAt: '2026-12-21T09:00:00.000Z',
  deliveredBy: user,
};
// confirmation dialogs: «Abbrechen» left, the confirming button right
const dialogButtons = () =>
  within(screen.getByRole('dialog'))
    .getAllByRole('button')
    .map(button => button.textContent);
const toggle = (name: string) => screen.getByRole('switch', { name });
const button = (name: string) => screen.getByRole('button', { name });
const noButton = (name: string) =>
  expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
const open = (kind: string) =>
  fireEvent.click(button(`printIssues.flow.${kind}`));

beforeEach(() => {
  vi.clearAllMocks();
  for (const record of [queries, mutations]) {
    for (const key of Object.keys(record)) {
      delete record[key];
    }
  }
  withContext();
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
  describe('an open issue without Drucklisten', () => {
    beforeEach(() => withIssue());

    it('shows the empty table and offers the first Druckliste; no options until then', () => {
      renderView();

      expect(
        screen.getByText('printIssues.listView.title {"label":"1.27"}')
      ).toBeInTheDocument();
      expect(
        screen.getByText('printIssues.deliveries.empty')
      ).toBeInTheDocument();
      expect(button('printIssues.flow.create')).toBeEnabled();
      expect(button('printIssues.deliveries.fullList')).toBeDisabled();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      noButton('printIssues.compute');
    });

    it('shows no hint for the complete list while there is nothing to download', async () => {
      renderView();

      const fullList = button('printIssues.deliveries.fullList');
      expect(fullList).toBeDisabled();
      fireEvent.mouseOver(fullList.parentElement!);
      fireEvent.mouseOver(fullList);
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it("opens the options prefilled with the issue's and computes with them, saving nothing", async () => {
      renderView();

      open('create');

      expect(screen.getByText('printIssues.steps.options')).toBeInTheDocument();
      expect(toggle('printExportOptions.includeBexio')).toBeChecked();
      expect(toggle('printExportOptions.includeOpen')).toBeChecked();
      expect(toggle('printExportOptions.includeUpcoming')).not.toBeChecked();
      noButton('printIssues.flow.create');

      fireEvent.click(button('printIssues.compute'));

      await waitFor(() =>
        expect(mutations['ComputePrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1' },
        })
      );
      expect(mutations['UpdatePrintIssue']).not.toHaveBeenCalled();
    });

    it('saves changed options on the issue before computing, so the list uses them', async () => {
      renderView();

      open('create');
      fireEvent.click(toggle('printExportOptions.includeOpen'));
      fireEvent.click(button('printIssues.compute'));

      await waitFor(() =>
        expect(mutations['ComputePrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1' },
        })
      );
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
              options: options({ includeOpen: false }),
            },
          },
        })
      );
      expect(
        mutations['UpdatePrintIssue']!.mock.invocationCallOrder[0]
      ).toBeLessThan(
        mutations['ComputePrintIssueRun']!.mock.invocationCallOrder[0]!
      );
    });

    it('disables bexio with a hint while no provider has a key', () => {
      withContext({ bexioConfigured: false });
      renderView();

      open('create');

      expect(toggle('printExportOptions.includeBexio')).toBeDisabled();
      expect(
        screen.getByText('printExportOptions.bexioNotConfigured')
      ).toBeInTheDocument();
    });

    it("resets the options to the medium's defaults", () => {
      withContext({
        defaults: options({ includeBexio: false, memberPlanIds: ['plan-a'] }),
      });
      renderView();

      open('create');
      fireEvent.click(button('printIssues.options.reset'));

      expect(toggle('printExportOptions.includeBexio')).not.toBeChecked();
      // the plan picker has no plans to name here, so it shows the picked id
      expect(screen.getByText('plan-a')).toBeInTheDocument();
    });

    it('shows the computed list with who computed it, and its addresses in an overlay', async () => {
      computes(storedRun());
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));

      expect(
        await screen.findByText(
          /printIssues\.computedLine .*"name":"Maria Muster"/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/printIssues\.summary\.headline/)
      ).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

      fireEvent.click(button('printIssues.showList {"count":2}'));

      const overlay = await screen.findByRole('dialog');
      expect(overlay).toHaveTextContent('Alpha');
      expect(overlay).toHaveTextContent('Beta');
    });

    it('exports exactly the checked list after a confirmation, closes the flow and downloads nothing', async () => {
      computes(storedRun());
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));
      fireEvent.click(
        await screen.findByRole('button', { name: 'printIssues.export' })
      );

      expect(mutations['ExportPrintIssueRun']).not.toHaveBeenCalled();
      // counts come as plural-aware phrases: «1 Adresse», «2 Adressen»
      expect(
        screen.getByText(
          content =>
            content.startsWith('printIssues.exportQuestion.export') &&
            content.includes('printIssues.count.addresses {\\"count\\":2}') &&
            content.includes('printIssues.count.copies {\\"count\\":2}') &&
            content.includes('printIssues.count.grace {\\"count\\":1}')
        )
      ).toBeInTheDocument();
      expect(dialogButtons()).toEqual([
        'cancel',
        'printIssues.exportConfirm.export',
      ]);

      fireEvent.click(button('printIssues.exportConfirm.export'));

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
      await waitFor(() =>
        expect(
          screen.queryByText(/printIssues\.summary\.headline/)
        ).not.toBeInTheDocument()
      );
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      expect(button('printIssues.flow.create')).toBeInTheDocument();
      expect(downloadCsv).not.toHaveBeenCalled();
    });

    it('scrolls the page to its very end once the list is computed', async () => {
      computes(storedRun());
      const scrollTo = vi.fn();
      Element.prototype.scrollTo = scrollTo as never;
      renderView();

      open('create');
      // other components may scroll while rendering: only what computing does counts
      scrollTo.mockClear();
      fireEvent.click(button('printIssues.compute'));

      await screen.findByRole('button', { name: 'printIssues.export' });
      // nothing scrolls inside jsdom: the page itself is the scroll container
      await waitFor(() =>
        expect(scrollTo).toHaveBeenCalledWith(
          expect.objectContaining({ behavior: 'smooth' })
        )
      );
      expect(scrollTo.mock.contexts.at(-1)).toBe(document.scrollingElement);
      expect(scrollTo.mock.calls.at(-1)?.[0]).toMatchObject({
        top: document.scrollingElement?.scrollHeight,
      });
    });

    it('holds the export while the options changed after computing', async () => {
      computes(storedRun());
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));
      expect(
        await screen.findByRole('button', { name: 'printIssues.export' })
      ).toBeEnabled();

      fireEvent.click(toggle('printExportOptions.includeUpcoming'));

      expect(
        screen.getByText('printIssues.options.unsaved')
      ).toBeInTheDocument();
      expect(button('printIssues.export')).toBeDisabled();
    });

    it('asks to compute again when the export is refused', async () => {
      computes(storedRun());
      mutations['ExportPrintIssueRun'] = vi.fn(async () => {
        throw new Error(
          'The list was computed again in the meantime; check the new one.'
        );
      });
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));
      fireEvent.click(
        await screen.findByRole('button', { name: 'printIssues.export' })
      );
      fireEvent.click(button('printIssues.exportConfirm.export'));

      expect(
        await screen.findByText('printIssues.runConflict')
      ).toBeInTheDocument();
      // the closing dialog hides the page from the a11y tree until its transition ends
      expect(
        await screen.findByRole('button', { name: 'printIssues.compute' })
      ).toBeEnabled();
    });

    it('cancels without saving or computing anything', () => {
      renderView();

      open('create');
      fireEvent.click(toggle('printExportOptions.includeUpcoming'));
      fireEvent.click(button('printIssues.flow.cancel'));

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      expect(button('printIssues.flow.create')).toBeInTheDocument();
      expect(mutations['UpdatePrintIssue']).not.toHaveBeenCalled();
      expect(mutations['ComputePrintIssueRun']).not.toHaveBeenCalled();
    });
  });

  describe('an issue with a draft Druckliste', () => {
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

    it('lists the draft with its options, CSV, edit, delivered and delete, and the merged list', async () => {
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
      expect(
        within(row).getByRole('button', { name: 'printIssues.deliveries.edit' })
      ).toBeEnabled();
      expect(
        within(row).getByRole('button', {
          name: 'printIssues.deliveries.deliver',
        })
      ).toBeEnabled();

      fireEvent.click(
        within(row).getByRole('button', { name: 'printIssues.deliveries.csv' })
      );
      await waitFor(() =>
        expect(downloadCsv).toHaveBeenCalledWith('csv-del-0', 'file-del-0.csv')
      );

      fireEvent.click(button('printIssues.deliveries.fullList'));
      await waitFor(() =>
        expect(downloadCsv).toHaveBeenCalledWith('csv-all', 'file-all.csv')
      );
    });

    it("offers to edit the Druckliste with the draft's options and replaces it on export", async () => {
      computes(storedRun({ mode: 'replace', deliveryId: 'del-0' }));
      renderView();

      open('editFirst');

      expect(toggle('printExportOptions.includeBexio')).not.toBeChecked();
      expect(screen.getByText('plan-a')).toBeInTheDocument();
      noButton('printIssues.compute');

      fireEvent.click(button('printIssues.recompute'));

      await waitFor(() =>
        expect(mutations['ComputePrintIssueRun']).toHaveBeenCalled()
      );
      // the draft's options become the issue's, so the list is computed from them
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              options: options({
                memberPlanIds: ['plan-a', 'plan-b'],
                includeBexio: false,
              }),
            }),
          }),
        })
      );

      fireEvent.click(
        await screen.findByRole('button', { name: 'printIssues.export' })
      );
      expect(
        screen.getByText(
          /printIssues\.exportQuestion\.replace .*"date":"20.12.2026"/
        )
      ).toBeInTheDocument();
      fireEvent.click(button('printIssues.exportConfirm.replace'));

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
    });

    it('explains the complete list in a tooltip once there is one', async () => {
      renderView();

      fireEvent.mouseOver(button('printIssues.deliveries.fullList'));

      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'printIssues.deliveries.fullListHint'
      );
    });

    it('opens the same edit from the row', () => {
      renderView();

      fireEvent.click(button('printIssues.deliveries.edit'));

      expect(toggle('printExportOptions.includeBexio')).not.toBeChecked();
      expect(button('printIssues.recompute')).toBeEnabled();
      noButton('printIssues.flow.editFirst');
    });

    it('marks the draft as delivered after a confirmation', async () => {
      renderView();

      fireEvent.click(button('printIssues.deliveries.deliver'));
      expect(mutations['DeliverPrintIssueDelivery']).not.toHaveBeenCalled();
      expect(dialogButtons()).toEqual([
        'cancel',
        'printIssues.deliveries.deliverConfirm',
      ]);
      // the editor's default for a confirming button: primary, not warning
      expect(button('printIssues.deliveries.deliverConfirm')).toHaveClass(
        'MuiButton-colorPrimary'
      );
      expect(
        screen.getByText(
          /printIssues\.deliveries\.deliverQuestion .*"label":"1.27"/
        )
      ).toBeInTheDocument();

      fireEvent.click(button('printIssues.deliveries.deliverConfirm'));

      await waitFor(() =>
        expect(mutations['DeliverPrintIssueDelivery']).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'del-0' } })
        )
      );
    });

    it('deletes the draft after a confirmation', async () => {
      renderView();

      fireEvent.click(button('printIssues.deliveries.delete'));
      expect(dialogButtons()).toEqual([
        'cancel',
        'printIssues.deliveries.deleteConfirm',
      ]);
      fireEvent.click(button('printIssues.deliveries.deleteConfirm'));

      await waitFor(() =>
        expect(mutations['DeletePrintIssueDelivery']).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'del-0' } })
        )
      );
    });
  });

  describe('earlier issues with a draft', () => {
    beforeEach(() => {
      withIssue();
      computes(storedRun());
      stable('PrintIssues', {
        printIssues: [
          issue({
            id: 'earlier-draft',
            label: '6.26',
            issueDate: '2026-10-14',
            deliveries: [delivery({ id: 'd-626' })],
          }),
          issue({
            id: 'earlier-draft-2',
            label: '5.26',
            issueDate: '2026-08-23',
            deliveries: [
              delivery({ id: 'd-526', ...delivered }),
              delivery({ id: 'd-526-1', batch: 1 }),
            ],
          }),
          issue({
            id: 'earlier-delivered',
            label: '4.26',
            issueDate: '2026-06-14',
            deliveries: [delivery({ id: 'd-426', ...delivered })],
          }),
          issue({
            id: 'later-draft',
            label: '2.27',
            issueDate: '2027-03-15',
            deliveries: [delivery({ id: 'd-227' })],
          }),
          issue({ id: 'issue-1' }),
        ],
      });
    });

    it('names them in the check step, earliest first, and still lets the list be exported', async () => {
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));

      expect(
        await screen.findByText(
          'printIssues.earlierDrafts {"count":2,"labels":"5.26, 6.26"}'
        )
      ).toBeInTheDocument();
      expect(button('printIssues.export')).toBeEnabled();
    });

    it('says nothing while every earlier list is delivered', async () => {
      stable('PrintIssues', {
        printIssues: [
          issue({
            id: 'earlier-delivered',
            label: '4.26',
            issueDate: '2026-06-14',
            deliveries: [delivery({ id: 'd-426', ...delivered })],
          }),
          issue({ id: 'issue-1' }),
        ],
      });
      renderView();

      open('create');
      fireEvent.click(button('printIssues.compute'));

      await screen.findByRole('button', { name: 'printIssues.export' });
      expect(
        screen.queryByText(/printIssues\.earlierDrafts/)
      ).not.toBeInTheDocument();
    });
  });

  describe('an issue whose Druckliste is delivered', () => {
    beforeEach(() => withIssue({ deliveries: [delivery(delivered)] }));

    it('shows the delivery, offers neither edit, delivered nor delete for it, and a Nachlieferung', () => {
      renderView();

      expect(
        screen.getByText(
          'printIssues.deliveries.deliveredLine {"date":"21.12.2026","name":"Maria Muster"}'
        )
      ).toBeInTheDocument();
      noButton('printIssues.deliveries.edit');
      noButton('printIssues.deliveries.deliver');
      noButton('printIssues.deliveries.delete');
      expect(button('printIssues.flow.supplement')).toBeEnabled();
    });

    it('exports the next list as a Nachlieferung', async () => {
      computes(
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

      open('supplement');
      fireEvent.click(button('printIssues.compute'));

      fireEvent.click(
        await screen.findByRole('button', {
          name: 'printIssues.exportSupplement',
        })
      );
      noButton('printIssues.export');
      expect(
        screen.getByText(
          content =>
            content.startsWith('printIssues.exportQuestion.supplement') &&
            content.includes('"batch":1') &&
            content.includes('printIssues.count.addresses {\\"count\\":1}') &&
            content.includes('printIssues.count.copies {\\"count\\":1}')
        )
      ).toBeInTheDocument();

      fireEvent.click(button('printIssues.exportConfirm.supplement'));

      await waitFor(() =>
        expect(mutations['ExportPrintIssueRun']).toHaveBeenCalledWith({
          variables: { id: 'issue-1', computedAt: '2026-12-20T09:00:00.000Z' },
        })
      );
    });

    it('offers only to discard when nobody new is entitled', async () => {
      computes(
        storedRun({
          mode: 'supplement',
          batch: 1,
          rows: [],
          summary: summary({ rows: 0, copies: 0 }),
        })
      );
      renderView();

      open('supplement');
      fireEvent.click(button('printIssues.compute'));

      expect(
        await screen.findByText('printIssues.supplementEmpty')
      ).toBeInTheDocument();
      noButton('printIssues.exportSupplement');
      noButton('printIssues.compute');
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();

      fireEvent.click(button('printIssues.flow.discard'));

      expect(
        screen.queryByText('printIssues.supplementEmpty')
      ).not.toBeInTheDocument();
      expect(button('printIssues.flow.supplement')).toBeInTheDocument();
    });

    it('offers to edit a draft Nachlieferung', () => {
      withIssue({
        deliveries: [
          delivery(delivered),
          delivery({ id: 'del-1', batch: 1, rowCount: 3, copyCount: 3 }),
        ],
      });
      renderView();

      expect(button('printIssues.flow.editSupplement')).toBeEnabled();
      expect(
        screen.getAllByRole('button', { name: 'printIssues.deliveries.edit' })
      ).toHaveLength(1);
    });
  });

  describe('a closed issue', () => {
    beforeEach(() =>
      withIssue({
        status: 'closed',
        closedAt: '2027-02-01T10:00:00.000Z',
        closedBy: user,
        deliveries: [delivery(delivered)],
      })
    );

    it('explains that unlocking comes first and offers no Druckliste to add', () => {
      renderView();

      expect(screen.getByText('printIssues.closedInfo')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^printIssues\.flow\./ })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      expect(button('printIssues.deliveries.csv')).toBeEnabled();
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

    it('has neither Drucklisten nor options', () => {
      renderView();

      expect(
        screen.getByText('printIssues.historicNoExport')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^printIssues\.flow\./ })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });
});
