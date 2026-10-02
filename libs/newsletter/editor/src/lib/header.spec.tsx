import { fireEvent, render, screen } from '@testing-library/react';
import type { Data } from '@puckeditor/core';
import { MemoryRouter } from 'react-router-dom';
import { Actions, EditorHeader } from './header';
import { snapshotOf } from './settings';

const data = { root: { props: { preheader: '' } }, content: [] } as Data;

vi.mock('@puckeditor/core', () => ({
  usePuck: () => ({ appState: { data } }),
}));

describe('EditorHeader', () => {
  it('leads with a link back to the overview, ahead of Puck’s header', () => {
    render(
      <MemoryRouter>
        <EditorHeader>
          <div data-testid="puck-header" />
        </EditorHeader>
      </MemoryRouter>
    );

    const back = screen.getByRole('link', { name: 'newsletter.editor.back' });

    expect(back.getAttribute('href')).toBe('/newsletter');
    expect(
      back.compareDocumentPosition(screen.getByTestId('puck-header')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

const EDIT_URL = 'https://us1.admin.mailchimp.com/campaigns/edit?id=42';

const renderActions = (props: {
  saved?: string | null;
  synced?: string | null;
}) => {
  const save = vi.fn();

  render(
    <Actions
      title="Ausgabe 1"
      save={save}
      saved={null}
      synced={null}
      editUrl={EDIT_URL}
      status=""
      failed={false}
      {...props}
    />
  );

  return save;
};

const current = () => snapshotOf('Ausgabe 1', data);

describe('Actions', () => {
  it('shows the transfer state ahead of the buttons', () => {
    renderActions({});

    const save = screen.getByRole('button', { name: 'newsletter.editor.save' });
    const state = screen.getByText('newsletter.editor.notSaved');

    expect(
      state.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('saves the issue Puck holds', () => {
    const save = renderActions({});

    fireEvent.click(
      screen.getByRole('button', { name: 'newsletter.editor.save' })
    );

    expect(save).toHaveBeenCalledWith(data);
  });

  it('offers the Mailchimp draft once the issue is saved and synced', () => {
    const save = renderActions({ saved: current(), synced: current() });

    const view = screen.getByRole('link', {
      name: 'newsletter.editor.openInMailchimp',
    });

    expect(view.getAttribute('href')).toBe(EDIT_URL);
    expect(view.getAttribute('target')).toBe('_blank');

    fireEvent.click(view);

    expect(save).not.toHaveBeenCalled();
  });

  it('hides the Mailchimp draft when the issue changed since', () => {
    renderActions({
      saved: current(),
      synced: snapshotOf('Ausgabe 0', data),
    });

    expect(
      screen.queryByRole('link', { name: 'newsletter.editor.openInMailchimp' })
    ).toBeNull();
  });

  it('hides the Mailchimp draft when there is none', () => {
    render(
      <Actions
        title="Ausgabe 1"
        save={vi.fn()}
        saved={current()}
        synced={current()}
        editUrl={undefined}
        status=""
        failed={false}
      />
    );

    expect(
      screen.queryByRole('link', { name: 'newsletter.editor.openInMailchimp' })
    ).toBeNull();
  });
});
