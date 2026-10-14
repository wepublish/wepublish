import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BlockStylesDocument } from '@wepublish/editor/api';
import { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { TemplateEditorLayout } from './templateEditorLayout';

const unsavedChangesDialog = vi.fn(() => true);

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('./testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      BlockTemplateList: () => ({
        data: { blockTemplates: { nodes: [] } },
        loading: false,
        refetch: vi.fn(),
      }),
    },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  PermissionControl: ({
    children,
    qualifyingPermissions,
  }: {
    children?: unknown;
    qualifyingPermissions: string[];
  }) => (
    <div data-permissions={qualifyingPermissions.join(',')}>
      {children as never}
    </div>
  ),
  useUnsavedChangesDialog: () => unsavedChangesDialog,
}));

vi.mock(
  'react-i18next',
  async () => (await import('./testUtils')).translationMock
);

const blockStylesMock = [
  {
    request: { query: BlockStylesDocument, variables: {} },
    result: { data: { blockStyles: [] } },
  },
];

const defaultProps: ComponentProps<typeof TemplateEditorLayout> = {
  i18nPrefix: 'thingTemplates',
  backPath: '/things/templates',
  permissions: { create: 'CREATE', update: 'UPDATE' },
  isNew: false,
  hasChanged: false,
  disabled: false,
  itemId: 'template-1',
  name: 'News',
  onNameChange: vi.fn(),
  blocks: [],
  onBlocksChange: vi.fn(),
  onSave: vi.fn(),
  renderMetadata: close => (
    <button
      type="button"
      aria-label="metadata panel"
      onClick={close}
    />
  ),
};

const renderLayout = (
  props: Partial<ComponentProps<typeof TemplateEditorLayout>> = {}
) =>
  render(
    <MockedProvider mocks={blockStylesMock}>
      <MemoryRouter>
        <TemplateEditorLayout
          {...defaultProps}
          {...props}
        />
      </MemoryRouter>
    </MockedProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  unsavedChangesDialog.mockReturnValue(true);
});

describe('TemplateEditorLayout', () => {
  it('should edit the name of the template', () => {
    const onNameChange = vi.fn();
    renderLayout({ onNameChange });

    const name = screen.getByPlaceholderText('thingTemplates.edit.name');
    expect(name).toHaveValue('News');

    fireEvent.change(name, { target: { value: 'Renamed' } });

    expect(onNameChange).toHaveBeenCalledWith('Renamed');
  });

  it('should save an existing template with the update permission', () => {
    const onSave = vi.fn();
    renderLayout({ onSave });

    const save = screen.getByRole('button', { name: /^save$/i });
    expect(save.closest('[data-permissions]')).toHaveAttribute(
      'data-permissions',
      'UPDATE'
    );
    expect(
      screen
        .getByRole('group', { name: 'thingTemplates.edit.saved' })
        .closest('header')
    ).toBeInTheDocument();

    fireEvent.click(save);

    expect(onSave).toHaveBeenCalled();
  });

  it('should create a new template with the create permission', () => {
    renderLayout({ isNew: true });

    expect(
      screen
        .getByRole('button', { name: /^create$/i })
        .closest('[data-permissions]')
    ).toHaveAttribute('data-permissions', 'CREATE');
    expect(
      screen
        .getByRole('group', { name: 'thingTemplates.edit.new' })
        .closest('header')
    ).toBeInTheDocument();
  });

  it('should show unsaved changes', () => {
    renderLayout({ hasChanged: true });

    expect(
      screen
        .getByRole('group', { name: 'thingTemplates.edit.editing' })
        .closest('header')
    ).toBeInTheDocument();
  });

  it('should disable editing', () => {
    renderLayout({ disabled: true });

    expect(
      screen.getByPlaceholderText('thingTemplates.edit.name')
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /thingTemplates.edit.metadata/ })
    ).toBeDisabled();
  });

  it('should open and close the metadata', async () => {
    renderLayout();

    fireEvent.click(
      screen.getByRole('button', { name: /thingTemplates.edit.metadata/ })
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'metadata panel' })
    );

    expect(unsavedChangesDialog).not.toHaveBeenCalled();
  });

  it('should not offer metadata without a metadata panel', () => {
    renderLayout({ renderMetadata: undefined });

    expect(
      screen.queryByRole('button', { name: /thingTemplates.edit.metadata/ })
    ).not.toBeInTheDocument();
  });

  it('should go back to the list unless unsaved changes are kept', () => {
    unsavedChangesDialog.mockReturnValue(false);
    renderLayout({ hasChanged: true });

    const back = screen.getByRole('button', {
      name: 'thingTemplates.edit.backToList',
    });
    expect(back.closest('a')).toHaveAttribute('href', '/things/templates');

    fireEvent.click(back);

    expect(unsavedChangesDialog).toHaveBeenCalled();
  });

  it('should show what is loading', () => {
    renderLayout({ loadingMessage: 'Loading template' });

    expect(screen.getByText('Loading template')).toBeInTheDocument();
  });
});
