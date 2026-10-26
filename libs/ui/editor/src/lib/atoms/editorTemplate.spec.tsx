import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

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
});
