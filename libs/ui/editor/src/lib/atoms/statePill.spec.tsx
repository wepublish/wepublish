import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { StateColor } from '../utility';
import { StatePill } from './statePill';

const theme = createTheme({ cssVariables: true });

function renderedCss() {
  return Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent ?? '')
    .join('');
}

describe('StatePill', () => {
  it('wraps a long state label instead of cutting it off', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatePill state={StateColor.published}>
          <span>Article published on 25 October 2026 at 10:00</span>
        </StatePill>
      </ThemeProvider>
    );

    const css = renderedCss();

    expect(
      screen.getByText('Article published on 25 October 2026 at 10:00')
    ).toBeTruthy();
    expect(css).not.toContain('white-space:nowrap');
    expect(css).not.toContain('text-overflow:ellipsis');
    expect(css).toContain('overflow-wrap:anywhere');
  });
});
