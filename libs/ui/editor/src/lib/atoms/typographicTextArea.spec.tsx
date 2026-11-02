import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { TypographicTextArea } from './typographicTextArea';

const theme = createTheme({ cssVariables: true });

function renderedCss() {
  return Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent ?? '')
    .join('');
}

describe('TypographicTextArea', () => {
  it('takes its colours from the theme instead of literal token names', () => {
    render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea aria-label="Lead" />
      </ThemeProvider>
    );

    const css = renderedCss();

    expect(css).toContain('color:var(--mui-palette-text-primary)');
    expect(css).toContain(
      'background-color:var(--mui-palette-background-paper)'
    );
    expect(
      screen.getByRole('textbox', { name: 'Lead' }).getAttribute('style') ?? ''
    ).not.toContain('text.primary');
  });

  it('keeps the typography variant and alignment it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea
          aria-label="Title"
          variant="h1"
          align="center"
        />
      </ThemeProvider>
    );

    const css = renderedCss();

    expect(css).toContain('font-size:28px');
    expect(css).toContain('text-align:center');
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeTruthy();
  });

  it('grows to fit a value that arrives after mounting', () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(40);

    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea
          aria-label="Name"
          value=""
          onChange={() => undefined}
        />
      </ThemeProvider>
    );

    scrollHeight.mockReturnValue(120);
    rerender(
      <ThemeProvider theme={theme}>
        <TypographicTextArea
          aria-label="Name"
          value="A template name long enough to wrap onto several lines"
          onChange={() => undefined}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('textbox', { name: 'Name' }).style.height).toBe(
      '122px'
    );

    scrollHeight.mockRestore();
  });

  it('does not leak its styling props onto the textarea element', () => {
    render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea
          aria-label="Lead"
          variant="h2"
          align="right"
        />
      </ThemeProvider>
    );

    const textarea = screen.getByRole('textbox', { name: 'Lead' });

    expect(textarea.getAttribute('variant')).toBeNull();
    expect(textarea.getAttribute('align')).toBeNull();
  });
});
