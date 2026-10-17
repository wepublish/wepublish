import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CanCreateDocument } from '@wepublish/permissions';

import { AuthContext } from '../authContext';
import { DocumentEditPanel } from './documentEditPanel';

const save = vi.fn(async () => ({ data: { updateDocument: document } }));
const upload = vi.fn(async () => ({ data: { uploadDocument: document } }));
const query = vi.fn(async () => ({ data: { document } }));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: (document: unknown) => [
    JSON.stringify(document).includes('uploadDocument') ? upload : save,
    { loading: false },
  ],
  useApolloClient: () => ({ query }),
}));

const document = {
  id: 'document-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-02-03T10:00:00.000Z',
  filename: 'rehearsal',
  extension: '.pdf',
  fileSize: 2048,
  title: 'Rehearsal, act two',
  description: 'The second act, end to end',
  url: 'https://media.test/document/document-1/rehearsal.pdf',
};

const theme = createTheme({ cssVariables: true });

const session = {
  sessionRoles: [
    { id: 'role', name: 'admin', permissions: [CanCreateDocument] },
  ],
} as never;

const panel = (props: { id?: string; file?: File; onReplace?(): void }) => (
  <ThemeProvider theme={theme}>
    <AuthContext.Provider value={{ session } as never}>
      <DocumentEditPanel {...props} />
    </AuthContext.Provider>
  </ThemeProvider>
);

const renderPanel = (
  props: {
    id?: string;
    file?: File;
    onReplace?(): void;
  } = {}
) => render(panel(props));

const titleField = () => screen.getByRole('textbox', { name: /title/i });

describe('DocumentEditPanel', () => {
  beforeEach(() => {
    save.mockClear();
    upload.mockClear();
    query.mockClear();
    query.mockResolvedValue({ data: { document } });
  });

  it('opens on the title and description of the document it was given', async () => {
    renderPanel({ id: 'document-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('textbox', { name: /documents.panels.description/i })
    ).toHaveValue('The second act, end to end');
  });

  it('shows the document it loaded, not a parallel copy of it', async () => {
    renderPanel({ id: 'document-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('link', { name: 'documents.panels.openOriginal' })
    ).toHaveAttribute('href', document.url);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps what the user typed across a re-render', async () => {
    const { rerender } = renderPanel({ id: 'document-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    fireEvent.change(titleField(), { target: { value: 'Half-typed title' } });
    rerender(panel({ id: 'document-1' }));

    expect(titleField()).toHaveValue('Half-typed title');
  });

  it('lays its sections out as headings, the way the image drawer does', async () => {
    const { container } = renderPanel({ id: 'document-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    expect(
      screen.getByRole('heading', { name: 'documents.panels.information' })
    ).toBeInTheDocument();
    expect(container.querySelector('.MuiCard-root')).toBeNull();
  });

  it('saves what the form holds, not what was loaded', async () => {
    renderPanel({ id: 'document-1' });

    await waitFor(() => expect(titleField()).toHaveValue('Rehearsal, act two'));

    fireEvent.change(titleField(), { target: { value: 'Rehearsal, act one' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].variables).toMatchObject({
      id: 'document-1',
      title: 'Rehearsal, act one',
    });
  });

  it('describes a picked file without asking the api for anything', async () => {
    const file = new File(['x'], 'clip.mp4', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    expect(await screen.findByText(/clip/)).toBeInTheDocument();
    expect(titleField()).toHaveValue('');
    expect(query).not.toHaveBeenCalled();
  });

  it('splits a picked file into a name and an extension, not both at once', async () => {
    const file = new File(['x'], 'rehearsal.take.2.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    expect(await screen.findByText('rehearsal.take.2.pdf')).toBeInTheDocument();
  });

  it('uploads the name without the extension the api adds back', async () => {
    const file = new File(['x'], 'sample.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => expect(upload).toHaveBeenCalled());
    expect(upload.mock.calls[0][0].variables.filename).toBe('sample');
  });

  it('offers no public link for a file that is not uploaded yet', async () => {
    const file = new File(['x'], 'clip', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 4096 });

    renderPanel({ file });

    await waitFor(() => expect(titleField()).toHaveValue(''));

    expect(screen.queryByText('documents.panels.publicLink')).toBeNull();
    expect(screen.queryByText('documents.panels.openOriginal')).toBeNull();
  });

  it('lets the user go back and pick a different file', async () => {
    const onReplace = vi.fn();
    const file = new File(['x'], 'clip', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 4096 });

    render(panel({ file, onReplace }));

    await waitFor(() => expect(titleField()).toHaveValue(''));
    fireEvent.click(
      screen.getByRole('button', { name: 'documents.panels.replaceFile' })
    );

    expect(onReplace).toHaveBeenCalled();
  });

  it('says so when the document is not there', async () => {
    query.mockResolvedValue({ data: { document: null } } as never);

    renderPanel({ id: 'gone' });

    await waitFor(() => expect(query).toHaveBeenCalled());
    expect(titleField()).toHaveValue('');
  });
});
