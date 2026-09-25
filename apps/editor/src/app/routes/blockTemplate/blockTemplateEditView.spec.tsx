import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { BlockStylesDocument } from '@wepublish/editor/api';

import { BlockTemplateEditView } from './blockTemplateEditView';

const useBlockTemplateQuery = vi.fn();
const useBlockTemplateListQuery = vi.fn();
const updateBlockTemplate = vi.fn();
const refetch = vi.fn();

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...((await importOriginal()) as object),
  useBlockTemplateQuery: (...args: unknown[]) => useBlockTemplateQuery(...args),
  useBlockTemplateListQuery: (...args: unknown[]) =>
    useBlockTemplateListQuery(...args),
  useCreateBlockTemplateMutation: () => [vi.fn(), {}],
  useUpdateBlockTemplateMutation: () => [updateBlockTemplate, {}],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  useAuthorisation: () => true,
  useUnsavedChangesDialog: () => () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const blockStylesMock = [
  {
    request: { query: BlockStylesDocument, variables: {} },
    result: { data: { blockStyles: [] } },
  },
];

const titleBlock = (title: string) => ({
  __typename: 'TitleBlock',
  type: 'title',
  blockStyle: null,
  disabled: false,
  preTitle: null,
  title,
  lead: null,
});

const blockTemplate = ({
  modifiedAt = '2026-01-01T00:00:00.000Z',
  blocks = [titleBlock('Saved Title')],
} = {}) => ({
  __typename: 'BlockTemplate',
  id: 'template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt,
  name: 'Header Template',
  blocks,
});

const mockQuery = (template = blockTemplate()) => {
  useBlockTemplateQuery.mockReturnValue({
    data: { blockTemplate: template },
    refetch,
    loading: false,
  });
};

const view = () => (
  <MockedProvider mocks={blockStylesMock}>
    <MemoryRouter initialEntries={['/block-content/templates/edit/template-1']}>
      <Routes>
        <Route
          path="/block-content/templates/edit/:id"
          element={<BlockTemplateEditView />}
        />
      </Routes>
    </MemoryRouter>
  </MockedProvider>
);

const renderView = () => render(view());

const nameInput = () =>
  screen.getByPlaceholderText(
    'blockTemplates.edit.name'
  ) as HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
  useBlockTemplateListQuery.mockReturnValue({
    data: { blockTemplates: { nodes: [] } },
    loading: false,
    refetch: vi.fn(),
  });
  mockQuery();
});

describe('BlockTemplateEditView', () => {
  it('should take over the loaded block template', () => {
    renderView();

    expect(nameInput().value).toBe('Header Template');
    expect(screen.getByDisplayValue('Saved Title')).toBeInTheDocument();
  });

  it('should keep unsaved changes when the query result changes without a new revision', () => {
    const { rerender } = renderView();

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });
    fireEvent.change(screen.getByDisplayValue('Saved Title'), {
      target: { value: 'Edited Title' },
    });

    mockQuery(blockTemplate());
    rerender(view());

    expect(nameInput().value).toBe('Renamed Template');
    expect(screen.getByDisplayValue('Edited Title')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Saved Title')).not.toBeInTheDocument();
  });

  it('should take over the block template again once it has been saved', async () => {
    renderView();

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });

    mockQuery(
      blockTemplate({
        modifiedAt: '2026-02-02T00:00:00.000Z',
        blocks: [titleBlock('Saved Title')],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(
      await screen.findByDisplayValue('Header Template')
    ).toBeInTheDocument();
  });
});
