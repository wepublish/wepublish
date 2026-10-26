import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { ReactNode } from 'react';
import { MdSave } from 'react-icons/md';

import { StateColor } from '../utility';
import { EditorHeader, EditorHeaderButton } from './editorHeader';

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('EditorHeader', () => {
  it('shows the state of the document together with when it was saved', () => {
    renderWithTheme(
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
    renderWithTheme(
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

  it('only gives the actions a row of their own on narrow headers when there are secondary actions', () => {
    const { unmount } = renderWithTheme(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        primaryActions={<button>Save</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Save' }).closest('[data-own-row]')
    ).toBeNull();
    unmount();

    renderWithTheme(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        secondaryActions={<button>Metadata</button>}
        primaryActions={<button>Save</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Save' }).closest('[data-own-row]')
    ).not.toBeNull();
  });

  it('keeps the status action beside the status, ahead of the buttons', () => {
    renderWithTheme(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        statusAction={<button>Autosave</button>}
        secondaryActions={<button>Metadata</button>}
        primaryActions={<button>Publish</button>}
      />
    );

    expect(
      screen.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['Autosave', 'Metadata', 'Publish']);
  });
});

describe('EditorHeaderButton', () => {
  it('stays named for screen readers when its label collapses', () => {
    renderWithTheme(
      <EditorHeaderButton
        variant="outlined"
        icon={<MdSave />}
        label="Save"
      />
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
