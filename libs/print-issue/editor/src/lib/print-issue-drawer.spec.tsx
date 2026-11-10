import '@testing-library/jest-dom/vitest';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { PrintIssueDrawer } from './print-issue-drawer';
import { image, issue, operationName, renderWithRouter } from './test-utils';

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
  // the picker as buttons: choosing an image, removing it
  ChooseEditImage: ({
    image,
    onSelect,
    removeImage,
  }: {
    image?: { id: string } | null;
    onSelect?: (image: unknown) => void;
    removeImage?: () => void;
  }) => (
    <div>
      <span>{image ? `image ${image.id}` : 'no image'}</span>
      <button
        type="button"
        onClick={() => onSelect?.({ id: 'img-1', title: 'Cover' })}
      >
        pick image
      </button>
      <button
        type="button"
        onClick={() => removeImage?.()}
      >
        remove image
      </button>
    </div>
  ),
  ImageSelectPanel: () => null,
  ImageEditPanel: () => null,
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
              numberTo: null,
              year: thisYear,
              countsAs: 1,
              title: null,
              issueDate: '2027-01-15',
              note: 'Januar',
              historic: false,
              imageId: null,
            },
          },
        })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('prefills a new issue with the suggested number and year, like a duplicate', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={null}
        next={{ number: 4, year: 2027 }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByLabelText('printIssues.fields.number')).toHaveValue(4);
    expect(screen.getByLabelText('printIssues.fields.year')).toHaveValue(2027);

    fireEvent.change(screen.getByLabelText('printIssues.fields.issueDate'), {
      target: { value: '2027-07-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['CreatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              number: 4,
              numberTo: null,
              year: 2027,
              countsAs: 1,
              title: null,
              issueDate: '2027-07-15',
              note: null,
              historic: false,
              imageId: null,
            },
          },
        })
      )
    );
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
              numberTo: null,
              year: 2027,
              countsAs: 1,
              title: null,
              issueDate: '2027-01-15',
              note: 'alt',
              historic: false,
              imageId: null,
            },
          },
        })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('creates a double issue that counts as its numbers unless told otherwise, with a topic', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={null}
        next={{ number: 3, year: 2027 }}
        onClose={vi.fn()}
      />
    );

    // a single issue has nothing to count
    expect(
      screen.queryByLabelText('printIssues.fields.countsAs')
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('printIssues.fields.numberTo'), {
      target: { value: '4' },
    });
    expect(screen.getByLabelText('printIssues.fields.countsAs')).toHaveValue(
      '2'
    );
    fireEvent.change(screen.getByLabelText('printIssues.fields.countsAs'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('printIssues.fields.title'), {
      target: { value: 'Wem gehört die Stadt?' },
    });
    fireEvent.change(screen.getByLabelText('printIssues.fields.issueDate'), {
      target: { value: '2027-05-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['CreatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: expect.objectContaining({
              number: 3,
              numberTo: 4,
              countsAs: 1,
              title: 'Wem gehört die Stadt?',
            }),
          },
        })
      )
    );
  });

  it('turns a double issue back into a single one when the last number is cleared', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={
          issue({
            number: 3,
            numberTo: 4,
            countsAs: 2,
            label: '3/4.27',
            title: 'Stadt',
          }) as never
        }
        onClose={vi.fn()}
      />
    );

    expect(screen.getByLabelText('printIssues.fields.numberTo')).toHaveValue(4);
    expect(screen.getByLabelText('printIssues.fields.title')).toHaveValue(
      'Stadt'
    );
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('printIssues.fields.numberTo'), {
      target: { value: '' },
    });
    expect(
      screen.queryByLabelText('printIssues.fields.countsAs')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            id: 'issue-1',
            input: expect.objectContaining({
              number: 3,
              numberTo: null,
              countsAs: 1,
              title: 'Stadt',
            }),
          },
        })
      )
    );
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

  it('stores the image chosen for a new issue', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={null}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('no image')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'pick image' }));
    expect(screen.getByText('image img-1')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('printIssues.fields.issueDate'), {
      target: { value: '2027-01-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['CreatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: expect.objectContaining({ imageId: 'img-1' }),
          },
        })
      )
    );
  });

  it('keeps or removes the image of an existing issue, and counts a change as an edit', async () => {
    renderWithRouter(
      <PrintIssueDrawer
        open
        issue={issue({ imageId: 'img-1', image: image() }) as never}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('image img-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'remove image' }));
    expect(screen.getByRole('button', { name: 'save' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutations['UpdatePrintIssue']).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            id: 'issue-1',
            input: expect.objectContaining({ imageId: null }),
          },
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
