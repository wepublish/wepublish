import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';

import { EditorTemplate } from './editorTemplate';

const theme = createTheme({ cssVariables: true });

function renderedCss() {
  return Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent ?? '')
    .join('');
}

describe('EditorTemplate', () => {
  it('keeps a gutter wide enough for the block side columns', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditorTemplate>content</EditorTemplate>
      </ThemeProvider>
    );

    expect(screen.getByText('content')).toBeTruthy();
    expect(renderedCss()).toContain('width:min(80%, calc(100% - 340px))');
  });

  it('gives the page a heading named after the editor', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditorTemplate title="Edit article">
          <input aria-label="Title" />
        </EditorTemplate>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit article' })
    ).toBeInTheDocument();
  });

  it('marks the editor as the main landmark', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditorTemplate title="Edit article">
          <input aria-label="Title" />
        </EditorTemplate>
      </ThemeProvider>
    );

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('textbox', { name: 'Title' })
    );
  });

  it('adds no heading when no title is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditorTemplate>content</EditorTemplate>
      </ThemeProvider>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('tells sticky content how tall the sticky navigation is', async () => {
    const observers: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observers.push(callback);
        }
        observe() {
          observers.at(-1)?.(
            [
              {
                contentRect: { height: 66 },
                borderBoxSize: [{ blockSize: 66, inlineSize: 800 }],
                contentBoxSize: [{ blockSize: 66, inlineSize: 800 }],
              } as unknown as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver
          );
        }
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );

    render(
      <ThemeProvider theme={theme}>
        <EditorTemplate navigationChildren={<nav>Save</nav>}>
          <div data-testid="content" />
        </EditorTemplate>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen
          .getByTestId('content')
          .closest<HTMLElement>('[style*="--wep-sticky-top"]')
          ?.style.getPropertyValue('--wep-sticky-top')
      ).toBe('66px')
    );

    vi.unstubAllGlobals();
  });
});
