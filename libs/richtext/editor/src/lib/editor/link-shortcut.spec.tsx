import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { CSSProperties } from 'react';
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
        <div style={{ '--wep-sticky-top': '66px' } as CSSProperties}>
          <RichtextEditor defaultValue={content} />
        </div>
      </ThemeProvider>
    </MockedProvider>
  );

  return view.container.querySelector('.ProseMirror') as HTMLElement;
};

const pressModK = (target: HTMLElement) =>
  fireEvent.keyDown(target, {
    key: 'k',
    code: 'KeyK',
    ...(/Mac/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }),
  });

describe('toolbar', () => {
  it('sticks below whatever sticky navigation the page has', () => {
    const prosemirror = renderEditor();
    const toolbar = prosemirror
      .closest('.MuiPaper-root')
      ?.querySelector<HTMLElement>(':scope > :first-child');

    expect(toolbar).not.toBeNull();
    expect(getComputedStyle(toolbar!).position).toBe('sticky');
    expect(getComputedStyle(toolbar!).top).toBe('66px');
  });
});

describe('link shortcut', () => {
  it('opens the link menu on Mod+K and keeps the keystroke to itself', async () => {
    const prosemirror = renderEditor();
    prosemirror.focus();

    const notCancelled = pressModK(prosemirror);

    expect(notCancelled).toBe(false);
    await waitFor(() =>
      expect(screen.getByText('richtext.link.title')).toBeInTheDocument()
    );
  });

  it('opens the bubble menu link menu once on Mod+K over a selection', async () => {
    const prosemirror = renderEditor();
    const editor = (prosemirror as HTMLElement & { editor: Editor }).editor;
    editor.commands.focus();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    pressModK(prosemirror);

    await waitFor(() =>
      expect(screen.getAllByText('richtext.link.title')).toHaveLength(1)
    );
  });
});
