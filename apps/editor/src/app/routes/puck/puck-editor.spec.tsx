import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  PuckData,
  PuckDocumentController,
} from '@wepublish/puck-content/editor';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { PropsWithChildren, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { PuckDocumentEditor, PuckDocumentEditorProps } from './puck-editor';

vi.mock('@wepublish/puck-content/editor', async importOriginal => ({
  ...(await importOriginal<object>()),
  puckBlockDataPlugin: {
    name: 'puck-block-data',
    overrides: {
      puck: ({ children }: PropsWithChildren) => (
        <>
          <output aria-label="Block data" />
          {children}
        </>
      ),
    },
  },
}));

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
  props: Partial<PuckDocumentEditorProps<'article'>> = {},
  wrap: (children: ReactNode) => ReactNode = children => children
) =>
  render(
    wrap(
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
    )
  );

describe('PuckDocumentEditor', () => {
  it('shows the state of the document the route controls in the header', () => {
    renderEditor();

    expect(
      screen.getByRole('group', { name: 'Unpublished' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('lets a template be named in the settings of the document', async () => {
    renderEditor({
      data: {
        ...data,
        root: { props: { title: 'Hello', templateName: 'News' } as never },
      },
      templateNameLabel: 'Template name',
    });

    expect(await screen.findAllByDisplayValue('News')).not.toHaveLength(0);
    expect(screen.getAllByText('Template name')).not.toHaveLength(0);
    expect(screen.queryByText('Slug')).not.toBeInTheDocument();
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

  it('announces the previewed version in a banner below the header', async () => {
    renderEditor({
      revisionHistory: {
        revisions: [
          {
            id: 'revision-2',
            createdAt: '2026-10-02T08:00:00.000Z',
            title: 'Second draft',
          },
          {
            id: 'revision-1',
            createdAt: '2026-10-01T08:00:00.000Z',
            title: 'First draft',
          },
        ],
        draftId: 'revision-2',
        canRestore: true,
        onRestore: vi.fn(),
        loadRevision: async () => ({ data }),
      },
    });

    fireEvent.click(screen.getByText('History'));
    fireEvent.click(
      await screen.findByRole('button', { name: /versionHistory.preview/ })
    );

    const banner = await screen.findByRole('region', {
      name: /revisionPreview.label/,
    });

    expect(
      within(banner).getByRole('button', { name: /revisionPreview.restore/ })
    ).toBeInTheDocument();
  });

  it('names the blocks in the outline by their translated name', async () => {
    const i18n = createInstance();

    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: {
        en: {
          translation: {
            puck: { blocks: { names: { LinkedTemplate: 'Linked template' } } },
          },
        },
      },
    });

    renderEditor(
      {
        data: {
          ...data,
          content: [
            {
              type: 'LinkedTemplate',
              props: { id: 'LinkedTemplate-1', templateId: 'tpl' },
            },
          ],
        },
      },
      children => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    );

    fireEvent.click(screen.getByText('Outline', { selector: 'span' }));

    expect(
      (await screen.findAllByText('Linked template'))[0]
    ).toBeInTheDocument();
    expect(screen.queryByText('LinkedTemplate')).toBeNull();
  });

  it('names the root of a block template a block template', async () => {
    const i18n = createInstance();

    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: {
        en: {
          translation: {
            puck: {
              documentKind: { page: 'Page', blockTemplate: 'Block template' },
            },
          },
        },
      },
    });

    renderEditor(
      { blockTemplate: true, templateNameLabel: 'Name' },
      children => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    );

    expect(
      (await screen.findAllByText('Block template'))[0]
    ).toBeInTheDocument();
    expect(screen.queryByText('Page')).toBeNull();
  });

  it('gives the blocks in the canvas the data of their datasources', () => {
    renderEditor();

    expect(
      screen.getByRole('status', { name: 'Block data' })
    ).toBeInTheDocument();
  });
});
