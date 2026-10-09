import { render, screen, within } from '@testing-library/react';
import { MdSave } from 'react-icons/md';

import { StateColor } from '../utility';
import { EditorHeader, EditorHeaderButton } from './editorHeader';

describe('EditorHeader', () => {
  it('shows the state of the document together with when it was saved', () => {
    render(
      <EditorHeader
        state={StateColor.published}
        stateLabel="Published on 1 Sep"
        meta="Last saved 2 Sep"
      />
    );

    const status = screen.getByRole('group', { name: 'Published on 1 Sep' });

    expect(within(status).getByText('Published on 1 Sep')).toBeTruthy();
    expect(within(status).getByText('Last saved 2 Sep')).toBeTruthy();
  });

  it('keeps the primary actions after the secondary ones', () => {
    render(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        secondaryActions={<button>Metadata</button>}
        primaryActions={<button>Publish</button>}
      />
    );

    const [metadata, publish] = screen.getAllByRole('button');

    expect(metadata.textContent).toBe('Metadata');
    expect(publish.textContent).toBe('Publish');
  });
});

describe('EditorHeaderButton', () => {
  it('stays named for screen readers when its label collapses', () => {
    render(
      <EditorHeaderButton
        icon={<MdSave />}
        label="Save"
      />
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
