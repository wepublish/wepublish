import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PuckDocumentController } from '@wepublish/puck-content/editor';
import { PuckData } from '@wepublish/puck-content/website';
import { MemoryRouter } from 'react-router-dom';

import { PuckDocumentEditor, PuckDocumentEditorProps } from './puck-editor';

const theme = createTheme({ cssVariables: true });

const data: PuckData<'article'> = {
  root: { props: { title: 'Hello', slug: 'hello' } },
  content: [],
};

const controller: PuckDocumentController = {
  backTo: '/articles',
  backLabel: 'Back',
  status: 'draft',
  statusLabel: 'Unpublished',
  isNew: false,
  hasUnpublishedChanges: true,
  canSave: true,
  canPublish: true,
  onSave: vi.fn(async () => undefined),
  onPublish: vi.fn(async () => undefined),
};

const renderEditor = (
  props: Partial<PuckDocumentEditorProps<'article'>> = {}
) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <PuckDocumentEditor
            kind="article"
            data={data}
            controller={controller}
            {...props}
          />
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>
  );

describe('PuckDocumentEditor', () => {
  it('shows the state of the document the route controls in the header', () => {
    renderEditor();

    expect(
      screen.getByRole('group', { name: 'Unpublished' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('asks the route for the publish dialog of the root props being edited', () => {
    renderEditor({
      publishDialogOf: rootProps => ({
        title: `Publish ${'title' in rootProps ? rootProps.title : ''}`,
        dateLabel: 'Publish date',
        checks: [],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(
      within(screen.getByRole('dialog')).getByText('Publish Hello')
    ).toBeInTheDocument();
  });

  it('shows the version history of the route and tells it when it is opened', async () => {
    const onPluginChange = vi.fn();

    renderEditor({
      onPluginChange,
      revisionHistory: {
        revisions: [
          {
            id: 'revision-1',
            createdAt: '2026-10-01T08:00:00.000Z',
            title: 'First draft',
          },
        ],
        draftId: 'revision-1',
        canRestore: true,
        onRestore: vi.fn(),
      },
    });

    fireEvent.click(screen.getByText('History'));

    expect(onPluginChange).toHaveBeenLastCalledWith('revisioning');
    expect(await screen.findByText('First draft')).toBeInTheDocument();
  });
});
