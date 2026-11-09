import '@testing-library/jest-dom/vitest';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PrintIssueList } from './print-issue-list';
import {
  delivery,
  issue,
  operationName,
  renderWithRouter,
  user,
} from './test-utils';

const issuesQuery = vi.fn();
const mutations: Record<string, ReturnType<typeof vi.fn>> = {};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown) =>
    operationName(document) === 'PrintIssues' ? issuesQuery() : (
      { data: undefined, loading: false, refetch: vi.fn() }
    ),
  useMutation: (document: unknown) => {
    const name = operationName(document);
    mutations[name] ??= vi.fn(async () => ({ data: {} }));

    return [mutations[name], { loading: false }];
  },
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

const handedOver = {
  deliveredAt: '2026-10-13T09:00:00.000Z',
  deliveredBy: user,
};

const issues = [
  issue({
    id: 'issue-closed',
    label: '6.26',
    number: 6,
    year: 2026,
    issueDate: '2026-10-14',
    status: 'closed',
    closedAt: '2026-11-01T09:00:00.000Z',
    closedBy: user,
    deliveries: [
      delivery({ ...handedOver, copyCount: 1197 }),
      delivery({ id: 'del-1', batch: 1, ...handedOver, copyCount: 3 }),
    ],
  }),
  issue({
    id: 'issue-delivered',
    label: '3.27',
    number: 3,
    deliveries: [delivery({ ...handedOver, copyCount: 500 })],
  }),
  issue({
    id: 'issue-exported',
    label: '1.27',
    deliveries: [delivery({ copyCount: 850 })],
  }),
  issue({
    id: 'issue-open',
    label: '2.27',
    number: 2,
    issueDate: '2027-03-15',
  }),
  issue({
    id: 'issue-historic',
    label: '4.26',
    number: 4,
    year: 2026,
    issueDate: '2026-06-14',
    status: 'historic',
  }),
];

const renderList = (path = '/print-issues') =>
  renderWithRouter(
    <Routes>
      <Route
        path="/print-issues"
        element={<PrintIssueList />}
      />
      <Route
        path="/print-issues/create"
        element={<PrintIssueList />}
      />
      <Route
        path="/print-issues/edit/:id"
        element={<PrintIssueList />}
      />
    </Routes>,
    path
  );

const buttons = (name: string) => screen.getAllByRole('button', { name });

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mutations)) {
    delete mutations[key];
  }
  issuesQuery.mockReturnValue({
    data: { printIssues: issues },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('PrintIssueList', () => {
  it('shows each issue with its state, its deliveries and copies, and who closed it', () => {
    renderList();

    expect(screen.getByText('printIssues.status.closed')).toBeInTheDocument();
    expect(screen.getAllByText('printIssues.status.exported')).toHaveLength(2);
    expect(screen.getByText('printIssues.status.open')).toBeInTheDocument();
    expect(screen.getByText('printIssues.status.historic')).toBeInTheDocument();
    expect(
      screen.getByText('printIssues.deliveriesCell {"count":2,"delivered":2}')
    ).toBeInTheDocument();
    expect(
      screen.getByText('printIssues.deliveriesCell {"count":1,"delivered":0}')
    ).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(
      screen.getByText(
        'printIssues.closedLine {"date":"01.11.2026","name":"Maria Muster"}'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('printIssues.fields.finalizedAt')
    ).not.toBeInTheDocument();
  });

  it('opens the form from the label and the Druckliste from its own action, not for a historic issue', () => {
    renderList();

    expect(screen.getByRole('link', { name: '1.27' })).toHaveAttribute(
      'href',
      '/print-issues/edit/issue-exported'
    );
    const lists = screen.getAllByRole('link', {
      name: 'printIssues.actions.list',
    });
    expect(lists).toHaveLength(4);
    expect(lists[0]).toHaveAttribute('href', '/print-issues/issue-closed/list');
    expect(
      screen.getByRole('button', { name: 'printIssues.actions.list' })
    ).toBeDisabled();
    expect(screen.getByRole('columnheader', { name: 'action' })).toHaveStyle({
      position: 'sticky',
      right: '0px',
    });
  });

  it('closes an issue only once every delivery is handed over, after a confirmation', async () => {
    renderList();

    // closed: reopen instead; draft delivery, nothing exported, historic: not closable
    const close = buttons('printIssues.actions.close');
    expect(close).toHaveLength(4);
    expect(close[0]).toBeEnabled();
    close.slice(1).forEach(button => expect(button).toBeDisabled());

    fireEvent.click(close[0]!);
    expect(mutations['ClosePrintIssue']).not.toHaveBeenCalled();
    expect(
      screen.getByText('printIssues.closeQuestion {"label":"3.27"}')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'printIssues.closeConfirm' })
    );

    await waitFor(() =>
      expect(mutations['ClosePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-delivered' } })
      )
    );
  });

  it('reopens a closed issue right away', async () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: 'printIssues.actions.reopen' })
    );

    await waitFor(() =>
      expect(mutations['ReopenPrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-closed' } })
      )
    );
  });

  it('deletes an issue only while nothing was handed over, after a confirmation', async () => {
    renderList();

    const remove = buttons('printIssues.actions.delete');
    expect(remove).toHaveLength(5);
    expect(remove[0]).toBeDisabled();
    expect(remove[1]).toBeDisabled();
    remove.slice(2).forEach(button => expect(button).toBeEnabled());

    fireEvent.click(remove[2]!);
    expect(mutations['DeletePrintIssue']).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'printIssues.deleteConfirm' })
    );

    await waitFor(() =>
      expect(mutations['DeletePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-exported' } })
      )
    );
  });

  it('duplicates an issue as the next number', async () => {
    renderList();

    fireEvent.click(buttons('printIssues.actions.duplicate')[3]!);

    await waitFor(() =>
      expect(mutations['DuplicatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-open' } })
      )
    );
  });

  it('opens an empty form for a new issue, a filled one for an existing issue, none otherwise', () => {
    const form = () =>
      within(screen.getByRole('region', { name: /printIssues\.drawer/ }));

    const { unmount } = renderList('/print-issues/create');
    expect(form().getByLabelText('printIssues.fields.number')).toHaveValue(1);
    expect(form().getByLabelText('printIssues.fields.issueDate')).toHaveValue(
      ''
    );
    unmount();

    renderList('/print-issues/edit/issue-open');
    expect(form().getByLabelText('printIssues.fields.number')).toHaveValue(2);
    expect(form().getByLabelText('printIssues.fields.issueDate')).toHaveValue(
      '2027-03-15'
    );
  });

  it('shows no form on the plain list', () => {
    renderList();

    expect(
      screen.queryByLabelText('printIssues.fields.number')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'printIssues.create' })
    ).toHaveAttribute('href', '/print-issues/create');
  });
});
