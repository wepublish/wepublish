import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type DocumentListQuery,
  type DocumentStorageUsageQuery,
  type FullDocumentFragment,
  type UpdateDocumentMutation,
  type UpdateDocumentMutationVariables,
  type UploadDocumentMutation,
  type UploadDocumentMutationVariables,
  DocumentDocument,
  DocumentListDocument,
  DocumentStorageUsageDocument,
  UpdateDocumentDocument,
  UploadDocumentDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreateDocument,
  CanDeleteDocument,
  CanGetDocument,
  CanGetDocuments,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { DocumentList } from './documentList';

const report: FullDocumentFragment = {
  __typename: 'Document',
  id: 'doc-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-03T10:00:00.000Z',
  title: 'Jahresbericht',
  filename: 'jahresbericht',
  extension: '.pdf',
  fileSize: 2048,
  mimeType: 'application/pdf',
  description: 'Der Bericht',
  url: 'https://media.example.com/jahresbericht.pdf',
  thumbnailURL: null,
};

const uploaded: FullDocumentFragment = {
  ...report,
  id: 'doc-new',
  title: 'Budget',
  filename: 'budget',
  description: null,
};

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'document-editor',
        name: 'document-editor',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
});

const editor = sessionWith([
  CanGetDocuments,
  CanGetDocument,
  CanCreateDocument,
  CanDeleteDocument,
]);

const listRequests = vi.fn();
const storageRequests = vi.fn();
const updated = vi.fn<(variables: UpdateDocumentMutationVariables) => void>();
const uploads =
  vi.fn<
    (variables: Omit<UploadDocumentMutationVariables, 'file'>, file: File) => void
  >();

const listMock: MockLink.MockedResponse = {
  request: { query: DocumentListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: DocumentListQuery = {
      __typename: 'Query',
      documents: {
        __typename: 'PaginatedDocuments',
        nodes: [report],
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 1,
      },
    };

    return { data };
  },
};

const storageMock: MockLink.MockedResponse = {
  request: { query: DocumentStorageUsageDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    storageRequests();

    const data: DocumentStorageUsageQuery = {
      __typename: 'Query',
      documentStorageUsage: {
        __typename: 'DocumentStorageUsage',
        usedBytes: 2048,
        limitBytes: 0,
        documentCount: 1,
      },
    };

    return { data };
  },
};

const documentMock = (
  stored: FullDocumentFragment
): MockLink.MockedResponse => ({
  request: { query: DocumentDocument, variables: { id: stored.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { document: stored } },
});

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdateDocumentDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateDocumentMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdateDocumentMutation = {
      __typename: 'Mutation',
      updateDocument: {
        ...report,
        title: variables.title ?? report.title,
        description: variables.description ?? report.description,
      },
    };

    return { data };
  },
};

const uploadMock: MockLink.MockedResponse = {
  request: { query: UploadDocumentDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: ({ file, ...variables }: UploadDocumentMutationVariables) => {
    uploads(JSON.parse(JSON.stringify(variables)), file);

    const data: UploadDocumentMutation = {
      __typename: 'Mutation',
      uploadDocument: uploaded,
    };

    return { data };
  },
};

const defaultMocks = () => [
  listMock,
  storageMock,
  documentMock(report),
  documentMock(uploaded),
  updateMock,
  uploadMock,
];

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );

const renderDocuments = (route: string) =>
  renderFormRoutes(
    {
      '/documents': <DocumentList />,
      '/documents/upload': <DocumentList />,
      '/documents/edit/:id': <DocumentList />,
    },
    { route, mocks: defaultMocks(), wrapper: withSession(editor) }
  );

const drawer = () =>
  within(document.querySelector('.MuiDrawer-paper') as HTMLElement);

const titleInput = () => getFieldByLabel('documents.panels.title');
const descriptionInput = () => getFieldByLabel('documents.panels.description');

const loaded = () =>
  waitFor(() => expect(titleInput()).toHaveValue('Jahresbericht'));

const pdf = () =>
  new File(['%PDF'], 'budget.2026.pdf', { type: 'application/pdf' });

const pickFile = async (file: File) => {
  const input = await waitFor(() => {
    const element = document.querySelector<HTMLInputElement>(
      '.MuiDrawer-paper input[type="file"]'
    );

    expect(element).not.toBeNull();

    return element as HTMLInputElement;
  });

  fireEvent.change(input, { target: { files: [file] } });
};

beforeEach(() => {
  listRequests.mockClear();
  storageRequests.mockClear();
  updated.mockClear();
  uploads.mockClear();
});

describe('Document drawers', () => {
  it('opens the stored document on /documents/edit/:id', async () => {
    renderDocuments('/documents/edit/doc-1');

    await loaded();

    expect(
      drawer().getByRole('heading', {
        level: 2,
        name: 'documents.panels.editDocument',
      })
    ).toBeInTheDocument();
    expect(descriptionInput()).toHaveValue('Der Bericht');

    const file = formSectionOf('documents.panels.file');

    expect(file.getByText('jahresbericht.pdf')).toBeInTheDocument();
    expect(file.getByText('2.05 kB')).toBeInTheDocument();
    expect(
      file.getByRole('link', {
        name: 'https://media.example.com/jahresbericht.pdf',
      })
    ).toHaveAttribute('href', 'https://media.example.com/jahresbericht.pdf');
    expect(
      formSectionOf('documents.panels.information').getByRole('textbox', {
        name: 'documents.panels.title',
      })
    ).toBeInTheDocument();
  });

  it('updates title and description with exact variables and clears with null', async () => {
    const { user, currentPath } = renderDocuments('/documents/edit/doc-1');

    await loaded();
    await user.type(titleInput(), ' 2026');
    await user.clear(descriptionInput());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'doc-1',
      title: 'Jahresbericht 2026',
      description: null,
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/documents/edit/doc-1');
  });

  it('asks before discarding a dirty edit', async () => {
    const { user, currentPath } = renderDocuments('/documents/edit/doc-1');

    await loaded();
    await user.type(titleInput(), ' 2026');
    await user.click(drawer().getByRole('button', { name: 'close' }));

    expect(
      await screen.findByRole('dialog', {
        name: 'form.view.discardChanges.title',
      })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/documents/edit/doc-1');
  });

  it('shows the file picker first on /documents/upload', async () => {
    const { user, currentPath } = renderDocuments('/documents/upload');

    expect(
      drawer().getByText('documents.panels.dropDocument')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();

    await user.click(
      drawer().getByRole('button', { name: 'documents.panels.close' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/documents');
  });

  it('uploads a picked file with its details and closes after save and close', async () => {
    const { user, currentPath } = renderDocuments('/documents/upload');
    const file = pdf();

    await pickFile(file);

    expect(
      drawer().getByRole('heading', {
        level: 2,
        name: 'documents.panels.uploadDocument',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('documents.panels.file').getByText('budget.2026.pdf')
    ).toBeInTheDocument();

    await user.type(titleInput(), 'Budget');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(uploads).toHaveBeenCalledTimes(1));
    expect(uploads.mock.calls[0][0]).toStrictEqual({
      filename: 'budget.2026',
      title: 'Budget',
    });
    expect(uploads.mock.calls[0][1]).toBe(file);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/documents');
    await waitFor(() => expect(storageRequests).toHaveBeenCalledTimes(2));
  });

  it('lets the user go back and pick a different file', async () => {
    const { user } = renderDocuments('/documents/upload');

    await pickFile(pdf());
    await user.click(
      drawer().getByRole('button', { name: 'documents.panels.replaceFile' })
    );

    expect(
      drawer().getByText('documents.panels.dropDocument')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });

  it('opens the uploaded document after save', async () => {
    const { user, currentPath } = renderDocuments('/documents/upload');

    await pickFile(pdf());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/documents/edit/doc-new'));
    await waitFor(() => expect(titleInput()).toHaveValue('Budget'));
    expect(uploads.mock.calls[0][0]).toStrictEqual({
      filename: 'budget.2026',
    });
  });
});
