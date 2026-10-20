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
});
