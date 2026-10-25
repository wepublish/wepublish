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

  it('keeps the placeholder as its accessible name once text is entered', () => {
    render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea
          placeholder="Pre-title"
          defaultValue="Breaking"
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('textbox', { name: 'Pre-title' })).toBeTruthy();
  });

  it('prefers an explicit label over the placeholder', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="caption-label">Caption</span>
        <TypographicTextArea
          placeholder="Write a caption"
          aria-labelledby="caption-label"
        />
      </ThemeProvider>
    );

    const textarea = screen.getByRole('textbox', { name: 'Caption' });

    expect(textarea.getAttribute('aria-label')).toBeNull();
  });

  it('shows a focus outline instead of only the caret', () => {
    render(
      <ThemeProvider theme={theme}>
        <TypographicTextArea aria-label="Lead" />
      </ThemeProvider>
    );

    expect(renderedCss()).toMatch(
      /:focus-visible\{outline:2px solid var\(--mui-palette-primary-main\)/
    );
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
