import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { BlockStylesDocument } from '@wepublish/editor/api';
import {
  CanCreatePageTemplate,
  CanUpdatePageTemplate,
} from '@wepublish/permissions';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import { PageTemplateEditView } from './pageTemplateEditView';

const pageTemplateQueryMock = vi.fn();
const pageQueryMock = vi.fn();
const createPageTemplate = vi.fn();
const updatePageTemplate = vi.fn();
const refetch = vi.fn();
const isAuthorised = vi.fn((permission: string) => true);

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    useQuery: (document: unknown, options?: unknown) => {
      switch (operationName(document)) {
        case 'PageTemplate':
          return pageTemplateQueryMock(options);
        case 'Page':
          return pageQueryMock(options);
        case 'SettingsList':
          return { data: undefined };
        case 'BlockTemplateList':
          return {
            data: { blockTemplates: { nodes: [] } },
            loading: false,
            refetch: vi.fn(),
          };
        default:
          return (actual.useQuery as (...args: unknown[]) => unknown)(
            document,
            options
          );
      }
    },
    useMutation: (document: unknown) => {
      switch (operationName(document)) {
        case 'CreatePageTemplate':
          return [createPageTemplate, {}];
        case 'UpdatePageTemplate':
          return [updatePageTemplate, {}];
        default:
          return [vi.fn(), {}];
      }
    },
  };
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  useAuthorisation: (permission: string) => isAuthorised(permission),
  useUnsavedChangesDialog: () => () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
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

const pageTemplate = ({
  modifiedAt = '2026-01-01T00:00:00.000Z',
  blocks = [titleBlock('Saved Title')],
} = {}) => ({
  __typename: 'PageTemplate',
  id: 'page-template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt,
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt,
    name: 'Landing Template',
    blocks,
  },
  metadata: {
    __typename: 'PageTemplateMetadata',
    title: 'Metadata Title',
    description: 'Metadata Description',
    seoTitle: null,
    seoDescription: null,
    hidden: true,
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
});

const mockQuery = (template = pageTemplate()) => {
  pageTemplateQueryMock.mockImplementation(({ skip }: { skip?: boolean }) => ({
    data: skip ? undefined : { pageTemplate: template },
    refetch,
    loading: false,
  }));
};

const view = (path = '/pages/templates/edit/page-template-1') => (
  <MockedProvider mocks={blockStylesMock}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/pages/templates/create"
          element={<PageTemplateEditView />}
        />
        <Route
          path="/pages/templates/edit/:id"
          element={<PageTemplateEditView />}
        />
      </Routes>
    </MemoryRouter>
  </MockedProvider>
);

const nameInput = () =>
  screen.getByPlaceholderText('pageTemplates.edit.name') as HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
  isAuthorised.mockImplementation(() => true);
  pageQueryMock.mockReturnValue({ data: undefined, loading: false });
  mockQuery();
  updatePageTemplate.mockResolvedValue({});
});

describe('PageTemplateEditView', () => {
  it('should take over the loaded page template', () => {
    renderWithTheme(view());

    expect(pageTemplateQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'page-template-1' },
        skip: false,
      })
    );
    expect(nameInput().value).toBe('Landing Template');
    expect(screen.getByDisplayValue('Saved Title')).toBeInTheDocument();
  });

  it('should show the metadata of the page template', async () => {
    renderWithTheme(view());

    fireEvent.click(
      screen.getByRole('button', { name: /pageTemplates.edit.metadata/ })
    );

    expect(
      await screen.findByDisplayValue('Metadata Title')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Metadata Description')
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/pageEditor.panels.slug/)
    ).not.toBeInTheDocument();
  });

  it('should save the content and the metadata of the page template', async () => {
    renderWithTheme(view());

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(updatePageTemplate).toHaveBeenCalled());

    expect(updatePageTemplate).toHaveBeenCalledWith({
      variables: {
        id: 'page-template-1',
        name: 'Renamed Template',
        blocks: [
          {
            title: expect.objectContaining({ title: 'Saved Title' }),
          },
        ],
        metadata: expect.objectContaining({
          title: 'Metadata Title',
          description: 'Metadata Description',
          hidden: true,
          tagIds: ['tag-1'],
        }),
      },
    });
  });

  it('should keep unsaved changes when the query result changes without a new revision', () => {
    const { rerender } = renderWithTheme(view());

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });

    mockQuery(pageTemplate());
    rerender(view());

    expect(nameInput().value).toBe('Renamed Template');
  });

  it('should create a new page template and open it', async () => {
    pageTemplateQueryMock.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    createPageTemplate.mockResolvedValue({
      data: { createPageTemplate: { id: 'new-template' } },
    });

    renderWithTheme(view('/pages/templates/create'));

    expect(pageTemplateQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );

    fireEvent.change(nameInput(), { target: { value: 'New Template' } });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createPageTemplate).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          name: 'New Template',
          metadata: expect.objectContaining({ title: '' }),
        }),
      })
    );

    expect(createPageTemplate.mock.calls[0][0].variables.blocks).toEqual([]);
  });

  it('should create a copy of an existing page template', async () => {
    pageTemplateQueryMock.mockImplementation(
      ({ variables, skip }: { variables: { id: string }; skip: boolean }) =>
        !skip && variables.id === 'page-template-1' ?
          {
            data: { pageTemplate: pageTemplate() },
            loading: false,
            refetch,
          }
        : { data: undefined, loading: false, refetch }
    );
    createPageTemplate.mockResolvedValue({
      data: { createPageTemplate: { id: 'copied-template' } },
    });

    renderWithTheme(view('/pages/templates/create?copyFrom=page-template-1'));

    expect(nameInput().value).toBe(
      'pageTemplates.edit.copyName:Landing Template'
    );
    expect(screen.getByDisplayValue('Saved Title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createPageTemplate).toHaveBeenCalledWith({
        variables: {
          name: 'pageTemplates.edit.copyName:Landing Template',
          blocks: [
            {
              title: expect.objectContaining({ title: 'Saved Title' }),
            },
          ],
          metadata: expect.objectContaining({
            title: 'Metadata Title',
            description: 'Metadata Description',
            tagIds: ['tag-1'],
          }),
        },
      })
    );
    expect(updatePageTemplate).not.toHaveBeenCalled();
  });

  it('should create a page template from a page', async () => {
    pageTemplateQueryMock.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    pageQueryMock.mockImplementation(
      ({ variables, skip }: { variables: { id: string }; skip: boolean }) =>
        !skip && variables.id === 'page-1' ?
          {
            data: {
              page: {
                __typename: 'Page',
                id: 'page-1',
                slug: 'slug',
                url: 'https://example.com/slug',
                hidden: false,
                tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Other' }],
                latest: {
                  __typename: 'PageRevision',
                  title: 'Page Title',
                  description: 'Page Description',
                  seoTitle: null,
                  seoDescription: null,
                  socialMediaTitle: null,
                  socialMediaDescription: null,
                  image: null,
                  socialMediaImage: null,
                  properties: [],
                  blocks: [titleBlock('Page Block Title')],
                },
              },
            },
            loading: false,
          }
        : { data: undefined, loading: false }
    );
    createPageTemplate.mockResolvedValue({
      data: { createPageTemplate: { id: 'new-template' } },
    });

    renderWithTheme(view('/pages/templates/create?fromPage=page-1'));

    expect(nameInput().value).toBe('Page Title');
    expect(screen.getByDisplayValue('Page Block Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createPageTemplate).toHaveBeenCalledWith({
        variables: {
          name: 'Page Title',
          blocks: [
            {
              title: expect.objectContaining({ title: 'Page Block Title' }),
            },
          ],
          metadata: expect.objectContaining({
            title: 'Page Title',
            description: 'Page Description',
            hidden: false,
            tagIds: ['tag-2'],
          }),
        },
      })
    );
  });

  it('should show that the template to copy is loading', () => {
    pageTemplateQueryMock.mockImplementation(({ skip }: { skip: boolean }) =>
      skip ?
        { data: undefined, loading: false, refetch }
      : { data: undefined, loading: true, refetch }
    );

    renderWithTheme(view('/pages/templates/create?copyFrom=page-template-1'));

    expect(
      screen.getByText('pageTemplates.edit.loadingTemplate')
    ).toBeInTheDocument();
  });

  it('should show that the page is loading', () => {
    pageTemplateQueryMock.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    pageQueryMock.mockReturnValue({ data: undefined, loading: true });

    renderWithTheme(view('/pages/templates/create?fromPage=page-1'));

    expect(
      screen.getByText('pageTemplates.edit.loadingPage')
    ).toBeInTheDocument();
  });

  it('should not show a loader for a new empty template', () => {
    pageTemplateQueryMock.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });

    renderWithTheme(view('/pages/templates/create'));

    expect(
      screen.queryByText('pageTemplates.edit.loadingTemplate')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('pageTemplates.edit.loadingPage')
    ).not.toBeInTheDocument();
  });

  describe('permissions', () => {
    const onlyPermitted = (permitted: string) =>
      isAuthorised.mockImplementation(permission => permission === permitted);

    it('should allow saving an existing template with the update permission', () => {
      onlyPermitted(CanUpdatePageTemplate.id);
      renderWithTheme(view());

      expect(nameInput()).toBeEnabled();
      expect(screen.getByRole('button', { name: /^save$/i })).toBeEnabled();
    });

    it('should not allow saving an existing template with the create permission only', () => {
      onlyPermitted(CanCreatePageTemplate.id);
      renderWithTheme(view());

      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    });

    it('should allow creating a template with the create permission', () => {
      pageTemplateQueryMock.mockReturnValue({
        data: undefined,
        refetch,
        loading: false,
      });
      onlyPermitted(CanCreatePageTemplate.id);
      renderWithTheme(view('/pages/templates/create'));

      expect(screen.getByRole('button', { name: /^create$/i })).toBeEnabled();
    });

    it('should not allow creating a template with the update permission only', () => {
      pageTemplateQueryMock.mockReturnValue({
        data: undefined,
        refetch,
        loading: false,
      });
      onlyPermitted(CanUpdatePageTemplate.id);
      renderWithTheme(view('/pages/templates/create'));

      expect(screen.getByRole('button', { name: /^create$/i })).toBeDisabled();
    });
  });
});
