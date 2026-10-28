import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

describe('EditorHeader menu actions', () => {
  const renderMenu = (onHistory = vi.fn()) =>
    renderWithTheme(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        menuActions={[
          { label: 'Version history', icon: <MdSave />, onClick: onHistory },
          {
            label: 'Discard draft',
            icon: <MdSave />,
            onClick: vi.fn(),
            disabled: true,
          },
        ]}
        secondaryActions={<button>Preview</button>}
        primaryActions={<button>Publish</button>}
      />
    );

  it('shows them as buttons ahead of the other secondary actions', () => {
    renderMenu();

    expect(
      screen
        .getAllByRole('button', { hidden: true })
        .map(button => button.getAttribute('aria-label') ?? button.textContent)
    ).toEqual([
      'Version history',
      'Discard draft',
      'editorHeader.moreActions',
      'Preview',
      'Publish',
    ]);
  });

  it('offers them in a menu for narrow screens', () => {
    const onHistory = vi.fn();
    renderMenu(onHistory);

    fireEvent.click(screen.getByLabelText('editorHeader.moreActions'));

    const menu = screen.getByRole('menu');

    expect(
      within(menu).getByRole('menuitem', { name: 'Discard draft' })
    ).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(
      within(menu).getByRole('menuitem', { name: 'Version history' })
    );

    expect(onHistory).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('leaves out the menu when there is nothing to put in it', () => {
    renderWithTheme(
      <EditorHeader
        state={StateColor.draft}
        stateLabel="Draft"
        menuActions={[]}
      />
    );

    expect(screen.queryByLabelText('editorHeader.moreActions')).toBeNull();
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
