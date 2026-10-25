import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { RichtextEditor } from '../richtext-editor';

const theme = createTheme({ cssVariables: true });

const content = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
  ],
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

  return { prosemirror, editor: prosemirror.editor };
};

describe('menu bar', () => {
  it.each([
    'richtext.menuBar.undo',
    'richtext.menuBar.redo',
    'richtext.menuBar.bold',
    'richtext.menuBar.italic',
    'richtext.menuBar.underline',
    'richtext.menuBar.strike',
    'richtext.menuBar.subscript',
    'richtext.menuBar.superscript',
    'richtext.menuBar.textColor',
    'richtext.menuBar.backgroundColor',
    'richtext.menuBar.bulletList',
    'richtext.menuBar.orderedList',
    'richtext.menuBar.alignLeft',
    'richtext.menuBar.alignCenter',
    'richtext.menuBar.alignRight',
    'richtext.menuBar.link',
    'richtext.menuBar.table',
    'richtext.menuBar.codeBlock',
    'richtext.menuBar.blockquote',
    'richtext.menuBar.invisibleCharacters',
  ])('names the %s button', name => {
    renderEditor();

    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });

  it('names the text style select', () => {
    renderEditor();

    expect(
      screen.getByRole('combobox', { name: 'richtext.menuBar.textStyle' })
    ).toBeInTheDocument();
  });

  it.each([
    'richtext.menuBar.formatting',
    'richtext.menuBar.lists',
    'richtext.menuBar.alignment',
  ])('names the %s group', name => {
    renderEditor();

    expect(screen.getByRole('group', { name })).toBeInTheDocument();
  });

  it('exposes the code block state as pressed', async () => {
    const { editor } = renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.codeBlock',
    });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    editor.chain().setTextSelection(3).toggleCodeBlock().run();

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });

  it('exposes the blockquote state as pressed', async () => {
    const { editor } = renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.blockquote',
    });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    editor.chain().setTextSelection(3).toggleBlockquote().run();

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });

  it('exposes the invisible characters state as pressed', async () => {
    renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.invisibleCharacters',
    });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });

  it('names the link button after the action an active link offers', async () => {
    const { editor } = renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.link',
    });

    expect(button).not.toHaveAttribute('aria-pressed');
    editor
      .chain()
      .setTextSelection({ from: 1, to: 6 })
      .setLink({ href: 'https://example.com' })
      .setTextSelection(3)
      .run();

    expect(
      await screen.findByRole('button', { name: 'richtext.menuBar.editLink' })
    ).not.toHaveAttribute('aria-pressed');
  });

  it('includes the current text colour in the colour button name', async () => {
    const { editor } = renderEditor();

    editor
      .chain()
      .setTextSelection({ from: 1, to: 6 })
      .setColor('#ff0000')
      .setTextSelection(3)
      .run();

    expect(
      await screen.findByRole('button', {
        name: 'richtext.menuBar.textColor: #ff0000',
      })
    ).toBeInTheDocument();
  });
});

describe('link popover', () => {
  it('opens as a labelled dialog and reports its expanded state', async () => {
    renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.link',
    });

    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    expect(
      await screen.findByRole('dialog', { name: 'richtext.link.title' })
    ).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('returns focus to the link button on Escape without bubbling it', async () => {
    renderEditor();
    const onKeyDown = vi.fn();
    document.body.addEventListener('keydown', onKeyDown);
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.link',
    });

    fireEvent.click(button);
    await screen.findByRole('dialog', { name: 'richtext.link.title' });
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'richtext.link.url' }),
      { key: 'Escape' }
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(button).toHaveFocus();
    expect(onKeyDown).not.toHaveBeenCalled();
    document.body.removeEventListener('keydown', onKeyDown);
  });

  it('returns focus to the link button on cancel', async () => {
    renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.link',
    });

    fireEvent.click(button);
    await screen.findByRole('dialog', { name: 'richtext.link.title' });
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(button).toHaveFocus();
  });
});

describe('colour picker', () => {
  it('opens as a labelled dialog and returns focus on Escape', async () => {
    renderEditor();
    const onKeyDown = vi.fn();
    document.body.addEventListener('keydown', onKeyDown);
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.textColor',
    });

    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    const dialog = await screen.findByRole('dialog', {
      name: 'richtext.menuBar.textColor',
    });
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    );

    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(button).toHaveFocus();
    expect(onKeyDown).not.toHaveBeenCalled();
    document.body.removeEventListener('keydown', onKeyDown);
  });

  it('closes on Escape pressed on the trigger', async () => {
    renderEditor();
    const button = screen.getByRole('button', {
      name: 'richtext.menuBar.textColor',
    });

    fireEvent.click(button);
    await screen.findByRole('dialog', { name: 'richtext.menuBar.textColor' });
    fireEvent.keyDown(button, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(button).toHaveFocus();
  });

  it('returns focus to the trigger after clearing the colour', async () => {
    const { editor } = renderEditor();

    editor
      .chain()
      .setTextSelection({ from: 1, to: 6 })
      .setColor('#ff0000')
      .setTextSelection(3)
      .run();

    const button = await screen.findByRole('button', {
      name: 'richtext.menuBar.textColor: #ff0000',
    });

    fireEvent.click(button);
    const dialog = await screen.findByRole('dialog', {
      name: 'richtext.menuBar.textColor',
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'richtext.colorPicker.clear' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(button).toHaveFocus();
  });
});

describe('bubble menu', () => {
  it('names its formatting toggles and the link button', async () => {
    const { prosemirror, editor } = renderEditor();
    prosemirror.focus();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    await waitFor(() =>
      expect(
        screen.getAllByRole('group', { name: 'richtext.menuBar.formatting' })
      ).toHaveLength(2)
    );

    const bubble = screen.getAllByRole('group', {
      name: 'richtext.menuBar.formatting',
    })[1];

    for (const name of [
      'richtext.menuBar.bold',
      'richtext.menuBar.italic',
      'richtext.menuBar.underline',
      'richtext.menuBar.strike',
      'richtext.menuBar.subscript',
      'richtext.menuBar.superscript',
    ]) {
      expect(within(bubble).getByRole('button', { name })).toBeInTheDocument();
    }

    expect(
      within(bubble).getByRole('button', { name: 'richtext.menuBar.link' })
    ).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('returns focus to the editor when the link dialog is dismissed', async () => {
    const { prosemirror, editor } = renderEditor();
    prosemirror.focus();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    await waitFor(() =>
      expect(
        screen.getAllByRole('group', { name: 'richtext.menuBar.formatting' })
      ).toHaveLength(2)
    );

    const bubble = screen.getAllByRole('group', {
      name: 'richtext.menuBar.formatting',
    })[1];
    const linkButton = within(bubble).getByRole('button', {
      name: 'richtext.menuBar.link',
    });

    expect(linkButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(linkButton);

    const dialog = await screen.findByRole('dialog', {
      name: 'richtext.link.title',
    });
    expect(linkButton).toHaveAttribute('aria-expanded', 'true');
    expect(linkButton).toHaveAttribute('aria-controls', dialog.id);

    fireEvent.keyDown(
      within(dialog).getByRole('textbox', { name: 'richtext.link.url' }),
      { key: 'Escape' }
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(prosemirror).toHaveFocus();
  });
});

describe('table actions', () => {
  it('names every table action and exposes the header cell state', async () => {
    const { editor } = renderEditor();

    editor
      .chain()
      .setTextSelection(3)
      .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
      .run();

    for (const name of [
      'richtext.table.addColumnBefore',
      'richtext.table.addColumnAfter',
      'richtext.table.deleteColumn',
      'richtext.table.addRowBefore',
      'richtext.table.addRowAfter',
      'richtext.table.deleteRow',
      'richtext.table.mergeCells',
      'richtext.table.splitCell',
    ]) {
      expect(await screen.findByRole('button', { name })).toBeInTheDocument();
    }

    for (const name of [
      'richtext.table.columns',
      'richtext.table.rows',
      'richtext.table.cells',
    ]) {
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
    }

    expect(
      screen.getByRole('button', { name: 'richtext.table.toggleHeader' })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
