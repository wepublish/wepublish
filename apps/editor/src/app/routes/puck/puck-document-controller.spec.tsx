import '@testing-library/jest-dom/vitest';

import { Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  PuckDocumentController,
  PuckDocumentControllerContext,
  usePuckDocumentController,
} from '@wepublish/puck-content/editor';

import { documentControllerPlugin } from './puck-document-controller';
import {
  PuckDocumentEditorEvents,
  PuckDocumentEditorEventsContext,
} from './puck-document-controller.context';

const usePuck = createUsePuck();

const config: Config = {
  components: {},
  root: { fields: { title: { type: 'text' } } },
};

const data: Data = { root: { props: { title: 'Saved title' } }, content: [] };

const controller: PuckDocumentController = {
  backTo: '/pages',
  backLabel: 'Back',
  status: 'draft',
  statusLabel: 'Unpublished',
  isNew: false,
  hasUnpublishedChanges: true,
  canSave: true,
  canPublish: true,
  publishDialog: {
    title: 'Publish saved title',
    dateLabel: 'Publish date',
    checks: [],
  },
  onSave: async () => undefined,
};

function Probe() {
  const dispatch = usePuck(puck => puck.dispatch);
  const current = usePuckDocumentController();

  return (
    <>
      <button
        type="button"
        aria-label="Rename"
        onClick={() =>
          dispatch({
            type: 'replaceRoot',
            root: { props: { title: 'Edited title' } },
          })
        }
      />
      <button
        type="button"
        aria-label="Open history"
        onClick={() =>
          dispatch({ type: 'setUi', ui: { plugin: { current: 'history' } } })
        }
      />
      <output aria-label="Status">{current?.statusLabel}</output>
      <output aria-label="Publish dialog">
        {current?.publishDialog?.title}
      </output>
    </>
  );
}

const renderEditor = (events: PuckDocumentEditorEvents = {}) =>
  render(
    <PuckDocumentControllerContext.Provider value={controller}>
      <PuckDocumentEditorEventsContext.Provider value={events}>
        <Puck
          config={config}
          data={data}
          plugins={[documentControllerPlugin]}
        >
          <Probe />
        </Puck>
      </PuckDocumentEditorEventsContext.Provider>
    </PuckDocumentControllerContext.Provider>
  );

const publishDialog = () =>
  screen.getByRole('status', { name: 'Publish dialog' });

describe('documentControllerPlugin', () => {
  it('builds the publish dialog from the root props being edited', () => {
    renderEditor({
      publishDialogOf: rootProps => ({
        title: `Publish ${'title' in rootProps ? rootProps.title : ''}`,
        dateLabel: 'Publish date',
        checks: [],
      }),
    });

    expect(publishDialog()).toHaveTextContent('Publish Saved title');

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(publishDialog()).toHaveTextContent('Publish Edited title');
    expect(screen.getByRole('status', { name: 'Status' })).toHaveTextContent(
      'Unpublished'
    );
  });

  it('keeps the controller of the route when it builds no publish dialog', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(publishDialog()).toHaveTextContent('Publish saved title');
  });

  it('tells the route which plugin panel is open', () => {
    const onPluginChange = vi.fn();
    renderEditor({ onPluginChange });

    fireEvent.click(screen.getByRole('button', { name: 'Open history' }));

    expect(onPluginChange).toHaveBeenLastCalledWith('history');
  });
});
