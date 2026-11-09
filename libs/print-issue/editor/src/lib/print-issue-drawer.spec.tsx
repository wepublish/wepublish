import '@testing-library/jest-dom/vitest';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { PrintIssueDrawer } from './print-issue-drawer';
import { issue, operationName, renderWithRouter } from './test-utils';

const mutations: Record<string, ReturnType<typeof vi.fn>> = {};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useMutation: (document: unknown) => {
    const name = operationName(document);
    mutations[name] ??= vi.fn(async () => ({ data: {} }));

    return [mutations[name], { loading: false }];
  },
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  InfoTooltip: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

const thisYear = new Date().getFullYear();

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mutations)) {
    delete mutations[key];
  }
});

describe('PrintIssueDrawer', () => {
  it("creates an issue once a ship day is set, without options: the medium's defaults apply", async () => {
    const onClose = vi.fn();
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={null}
        onClose={onClose}
      />
    );

    expect(
      screen.getByText('printIssues.drawer.createTitle')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('printIssues.fields.issueDate'), {
      target: { value: '2027-01-15' },
    });
    fireEvent.change(screen.getByLabelText('printIssues.fields.note'), {
      target: { value: 'Januar' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['CreatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              number: 1,
              year: thisYear,
              issueDate: '2027-01-15',
              note: 'Januar',
              historic: false,
            },
          },
        })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('edits an existing issue and saves only once something changed, keeping its options', async () => {
    const onClose = vi.fn();
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={issue({ note: 'alt' }) as never}
        onClose={onClose}
      />
    );

    expect(
      screen.getByText('printIssues.drawer.editTitle {"label":"1.27"}')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('printIssues.fields.number')).toHaveValue(1);
    expect(screen.getByLabelText('printIssues.fields.year')).toHaveValue(2027);
    expect(screen.getByLabelText('printIssues.fields.issueDate')).toHaveValue(
      '2027-01-15'
    );
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('printIssues.fields.number'), {
      target: { value: '2' },
    });
    expect(screen.getByRole('button', { name: 'save' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            id: 'issue-1',
            input: {
              number: 2,
              year: 2027,
              issueDate: '2027-01-15',
              note: 'alt',
              historic: false,
            },
          },
        })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('lets an imported historic issue be corrected', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={
          issue({
            status: 'historic',
            number: 6,
            year: 2026,
            issueDate: '2026-10-14',
          }) as never
        }
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('printIssues.fields.issueDate'), {
      target: { value: '2026-10-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              number: 6,
              year: 2026,
              issueDate: '2026-10-15',
            }),
          }),
        })
      )
    );
  });

  it('closes without saving', () => {
    const onClose = vi.fn();
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={null}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(mutations['CreatePrintIssue']).not.toHaveBeenCalled();
  });
});
