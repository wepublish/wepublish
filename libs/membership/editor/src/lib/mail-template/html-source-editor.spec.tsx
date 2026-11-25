import { cleanup, render } from '@testing-library/react';

import { HtmlSourceEditor } from './html-source-editor';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({ cssVariables: true });

const wrapperOf = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

describe('HtmlSourceEditor', () => {
  afterEach(cleanup);

  it('is at least 400px tall by default', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <HtmlSourceEditor
          value="<p>Hallo</p>"
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(getComputedStyle(wrapperOf(container)).minHeight).toBe('400px');
  });

  // A minimum taller than the box it sits in pushes the bottom lines out of
  // sight, where the editor can't scroll them back into view.
  it('fits a smaller box when given a smaller minimum', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <HtmlSourceEditor
          value="<p>Hallo</p>"
          onChange={vi.fn()}
          minHeight={240}
        />
      </ThemeProvider>
    );

    expect(getComputedStyle(wrapperOf(container)).minHeight).toBe('240px');
  });

  describe('colour mode', () => {
    const schemeTheme = createTheme({
      cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
      colorSchemes: { light: true, dark: true },
    });

    const renderIn = (mode: 'light' | 'dark') =>
      render(
        <ThemeProvider
          theme={schemeTheme}
          defaultMode={mode}
        >
          <HtmlSourceEditor
            value="<p>Hallo</p>"
            onChange={vi.fn()}
          />
        </ThemeProvider>
      );

    beforeEach(() => localStorage.clear());

    // The light highlighting on the dark surface left the markup unreadable.
    it('highlights for a dark surface in dark mode', () => {
      const { container } = renderIn('dark');

      expect(container.querySelector('.cm-theme-dark')).toBeTruthy();
      expect(container.querySelector('.cm-theme-light')).toBeNull();
    });

    it('highlights for a light surface in light mode', () => {
      const { container } = renderIn('light');

      expect(container.querySelector('.cm-theme-light')).toBeTruthy();
    });
  });
});
