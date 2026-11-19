import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';

import { ContentWrapperStyled } from './content-wrapper';

// jsdom computes no grid styles, so read the css Emotion injected instead
const cssFor = (element: Element) => {
  const css = Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent ?? '')
    .join('');

  return Array.from(element.classList)
    .flatMap(cls => css.match(new RegExp(`\\.${cls}\\{[^}]*\\}`, 'g')) ?? [])
    .join('');
};

describe('ContentWrapperStyled', () => {
  // An `auto` column grows to its widest child's min-content. Widths measured
  // in JS at a wider viewport (image captions) then keep the page wider than
  // the screen after it shrinks, e.g. when the editor preview switches from
  // desktop to mobile.
  it('does not let its single column grow wider than the wrapper', () => {
    const { container } = render(
      <ThemeProvider theme={createTheme()}>
        <ContentWrapperStyled />
      </ThemeProvider>
    );

    expect(cssFor(container.querySelector('article') as Element)).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)/
    );
  });
});
