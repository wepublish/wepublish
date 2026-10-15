import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { forwardRef } from 'react';
import { LetterLayoutEdit } from './letter-layout-edit';

const layoutQuery = vi.fn();
const updateLayout = vi.fn();
const createLayout = vi.fn();
const preview = vi.fn();
const previewState = { data: undefined as unknown, loading: false };

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown, options?: { skip?: boolean }) =>
    operationName(document) === 'LetterLayoutById' && !options?.skip ?
      layoutQuery()
    : { data: undefined, loading: false },
  useLazyQuery: (document: unknown) =>
    operationName(document) === 'LetterLayoutPreview' ?
      [preview, previewState]
    : [vi.fn(), {}],
  useMutation: (document: unknown) => {
    switch (operationName(document)) {
      case 'UpdateLetterLayout':
        return [updateLayout, {}];
      case 'CreateLetterLayout':
        return [createLayout, {}];
      default:
        return [vi.fn(), {}];
    }
  },
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  ImageSelectPanel: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// CodeMirror needs a real layout engine; a textarea carries the same value.
vi.mock('../mail-template/html-source-editor', () => ({
  HtmlSourceEditor: forwardRef<
    HTMLTextAreaElement,
    { value: string; onChange: (value: string) => void; 'aria-label'?: string }
  >(function HtmlSourceEditor({ value, onChange }, ref) {
    return (
      <textarea
        ref={ref}
        aria-label="html"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    );
  }),
}));

// The real preview turns the pdf into an object url, which jsdom lacks.
vi.mock('../mail-template/letter-preview', () => ({
  LetterPreview: ({ pdf }: { pdf: string }) => (
    <div data-testid="letter-preview">{pdf}</div>
  ),
}));

const layout = {
  __typename: 'LetterLayoutModel',
  id: 'layout-1',
  name: 'Briefpapier Zwölf',
  isDefault: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-10-01T00:00:00.000Z',
  headerHtml: '<b>Zwölf</b>',
  footerHtml: '<i>IBAN</i>',
  headerHeightMm: 30,
  footerHeightMm: 20,
};

const renderEdit = (path = '/letterlayouts/edit/layout-1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/letterlayouts/edit/:id"
          element={<LetterLayoutEdit />}
        />
        <Route
          path="/letterlayouts/create"
          element={<LetterLayoutEdit />}
        />
      </Routes>
    </MemoryRouter>
  );

const nameInput = () =>
  screen.getByLabelText('letterLayouts.name') as HTMLInputElement;

beforeEach(() => {
  vi.clearAllMocks();
  previewState.data = undefined;
  previewState.loading = false;
  layoutQuery.mockReturnValue({
    data: { letterLayout: layout },
    loading: false,
  });
  updateLayout.mockResolvedValue({ data: { updateLetterLayout: layout } });
  createLayout.mockResolvedValue({
    data: { createLetterLayout: { ...layout, id: 'layout-new' } },
  });
});

describe('LetterLayoutEdit', () => {
  it('takes over the loaded stationery', () => {
    renderEdit();

    expect(nameInput().value).toBe('Briefpapier Zwölf');
    expect(screen.getByDisplayValue('<b>Zwölf</b>')).toBeInTheDocument();
    expect(screen.getByDisplayValue('<i>IBAN</i>')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('saves what was edited', () => {
    renderEdit();

    fireEvent.change(nameInput(), { target: { value: 'Briefpapier neu' } });
    fireEvent.change(screen.getByDisplayValue('<i>IBAN</i>'), {
      target: { value: '<i>IBAN CH00</i>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(updateLayout).toHaveBeenCalledWith({
      variables: {
        id: 'layout-1',
        input: {
          name: 'Briefpapier neu',
          isDefault: true,
          headerHtml: '<b>Zwölf</b>',
          footerHtml: '<i>IBAN CH00</i>',
          headerHeightMm: 30,
          footerHeightMm: 20,
        },
      },
    });
  });

  it('creates new stationery', () => {
    renderEdit('/letterlayouts/create');

    fireEvent.change(nameInput(), { target: { value: 'Neu' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(createLayout).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({ name: 'Neu', isDefault: false }),
      },
    });
  });

  it('previews the stationery as it is on screen, saved or not', () => {
    const { rerender } = renderEdit();

    fireEvent.change(screen.getByDisplayValue('<b>Zwölf</b>'), {
      target: { value: '<b>Zwölf neu</b>' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'letterLayouts.preview' })
    );

    expect(preview).toHaveBeenCalledWith({
      variables: {
        input: {
          headerHtml: '<b>Zwölf neu</b>',
          footerHtml: '<i>IBAN</i>',
          headerHeightMm: 30,
          footerHeightMm: 20,
        },
      },
    });

    previewState.data = { letterLayoutPreview: { pdf: 'JVBERi0=' } };
    rerender(
      <MemoryRouter initialEntries={['/letterlayouts/edit/layout-1']}>
        <Routes>
          <Route
            path="/letterlayouts/edit/:id"
            element={<LetterLayoutEdit />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('letter-preview')).toHaveTextContent('JVBERi0=');
  });
});
