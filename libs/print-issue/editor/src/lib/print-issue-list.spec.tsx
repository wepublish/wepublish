import '@testing-library/jest-dom/vitest';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PrintIssueList } from './print-issue-list';
import {
  image,
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
  // stands in for the markup-aware rendering: names the key and the tags it allows
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components?: Record<string, unknown>;
  }) => (
    <span
      data-trans={i18nKey}
      data-tags={Object.keys(components ?? {}).join(',')}
    >
      {i18nKey}
    </span>
  ),
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
    imageId: 'img-1',
    image: image(),
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

// confirmation dialogs: «Abbrechen» left, the confirming button right
const dialogButtons = () =>
  within(screen.getByRole('dialog'))
    .getAllByRole('button')
    .map(button => button.textContent);
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
    // the Drucklisten column: icon + number pairs, each explained by its tooltip
    expect(
      screen.getByLabelText(
        'printIssues.listCell.listsWithSupplements {"count":1}'
      )
    ).toHaveTextContent('2');
    expect(
      screen.getByLabelText(
        'printIssues.listCell.delivered {"delivered":2,"count":2}'
      )
    ).toHaveTextContent('2');
    expect(screen.getAllByLabelText('printIssues.listCell.lists')).toHaveLength(
      2
    );
    // a draft colours the «geliefert» chip and is named in its tooltip
    const withDraft = screen.getByLabelText(
      'printIssues.listCell.deliveredNone printIssues.listCell.draftHint {"name":"printIssues.deliveries.export"}'
    );
    expect(withDraft).toHaveTextContent('0');
    expect(withDraft).toHaveClass('MuiChip-colorWarning');
    expect(
      screen.getByLabelText(
        'printIssues.listCell.delivered {"delivered":2,"count":2}'
      )
    ).not.toHaveClass('MuiChip-colorWarning');
    expect(
      screen.queryByText(/printIssues\.deliveriesCell/)
    ).not.toBeInTheDocument();
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

    // closed: reopen instead; historic: frozen for good; draft delivery, nothing exported: not closable
    const close = buttons('printIssues.actions.close');
    expect(close).toHaveLength(3);
    expect(close[0]).toBeEnabled();
    close.slice(1).forEach(button => expect(button).toBeDisabled());
    expect(
      screen.getByRole('button', { name: 'printIssues.actions.historic' })
    ).toBeDisabled();

    fireEvent.click(close[0]!);
    expect(mutations['ClosePrintIssue']).not.toHaveBeenCalled();
    expect(
      screen.getByText('printIssues.closeQuestion {"label":"3.27"}')
    ).toBeInTheDocument();
    expect(dialogButtons()).toEqual(['cancel', 'printIssues.closeConfirm']);

    fireEvent.click(
      screen.getByRole('button', { name: 'printIssues.closeConfirm' })
    );

    await waitFor(() =>
      expect(mutations['ClosePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-delivered' } })
      )
    );
  });

  it('explains on the lock and delete of every issue why they are in their state, disabled or not', async () => {
    renderList();

    // a disabled button gets no pointer events: the tooltip listens on its wrapper
    const hover = (button: HTMLElement) =>
      fireEvent.mouseOver(button.parentElement!);
    const close = buttons('printIssues.actions.close');

    hover(screen.getByRole('button', { name: 'printIssues.actions.reopen' }));
    hover(close[0]!);
    hover(close[1]!);
    hover(close[2]!);
    hover(screen.getByRole('button', { name: 'printIssues.actions.historic' }));

    expect(
      await screen.findByText('printIssues.lockReason.reopen')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('printIssues.lockReason.close')
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'printIssues.lockReason.draft {"name":"printIssues.deliveries.export"}'
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText('printIssues.lockReason.noLists')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('printIssues.lockReason.historic')
    ).toBeInTheDocument();

    buttons('printIssues.actions.delete').forEach(hover);

    expect(
      await screen.findAllByText('printIssues.deleteReason.delivered')
    ).toHaveLength(2);
    expect(
      await screen.findByText('printIssues.deleteReason.draft')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('printIssues.deleteReason.empty')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('printIssues.deleteReason.historic')
    ).toBeInTheDocument();
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
    expect(dialogButtons()).toEqual(['cancel', 'printIssues.deleteConfirm']);
    fireEvent.click(
      screen.getByRole('button', { name: 'printIssues.deleteConfirm' })
    );

    await waitFor(() =>
      expect(mutations['DeletePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-exported' } })
      )
    );
  });

  it('duplicates an issue as the next number, never a historic one', async () => {
    renderList();

    const duplicate = buttons('printIssues.actions.duplicate');
    expect(duplicate).toHaveLength(5);
    duplicate.slice(0, 4).forEach(button => expect(button).toBeEnabled());
    expect(duplicate[4]).toBeDisabled();

    fireEvent.click(buttons('printIssues.actions.duplicate')[3]!);

    await waitFor(() =>
      expect(mutations['DuplicatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'issue-open' } })
      )
    );
  });

  it('opens a form for a new issue suggesting the next number of the latest year, a filled one for an existing issue, none otherwise', () => {
    const form = () =>
      within(screen.getByRole('region', { name: /printIssues\.drawer/ }));

    // 2027 is the latest year and 3.27 its highest number: the next is 4.27
    const { unmount } = renderList('/print-issues/create');
    expect(form().getByLabelText('printIssues.fields.number')).toHaveValue(4);
    expect(form().getByLabelText('printIssues.fields.year')).toHaveValue(2027);
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

  it('renders the intro below the heading with markup', () => {
    const { container } = renderList();

    expect(
      container.querySelector('[data-trans="printIssues.intro"]')
    ).toHaveAttribute('data-tags', 'strong,em,i,br');
  });

  it('shows the image of an issue as a thumbnail, nothing for one without', () => {
    const { container } = renderList();

    const thumbnails = container.querySelectorAll('img');
    expect(thumbnails).toHaveLength(1);
    expect(thumbnails[0]).toHaveAttribute(
      'src',
      'https://images.test/img-1/square.jpg'
    );
    // decorative: the issue label next to it names the row
    expect(thumbnails[0]).toHaveAttribute('alt', '');
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
