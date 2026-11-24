import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import i18next from 'i18next';
import { RichtextEditor } from '../../../richtext-editor';

const theme = createTheme({ cssVariables: true });

const content = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const renderEditor = () => {
  const view = render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <RichtextEditor defaultValue={content} />
      </ThemeProvider>
    </MockedProvider>
  );

  const prosemirror = view.container.querySelector(
    '.ProseMirror'
  ) as HTMLElement & { editor: Editor };

  return prosemirror.editor;
};

describe('slash commands', () => {
  beforeAll(() => i18next.init({ lng: 'cimode' }));

  it('opens the command list when typing a forward slash', async () => {
    const editor = renderEditor();
    editor.commands.focus();
    editor.commands.insertContent('/');

    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument());
    expect(
      screen.getByRole('menuitem', { name: 'richtext.commands.table' })
    ).toBeInTheDocument();
  });

  it('shows a placeholder when no command matches', async () => {
    const editor = renderEditor();
    editor.commands.focus();
    editor.commands.insertContent('/xyz');

    await waitFor(() =>
      expect(screen.getByText('richtext.commands.noResult')).toBeInTheDocument()
    );
  });
});
