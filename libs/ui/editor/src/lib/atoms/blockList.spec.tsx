import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';

import {
  BlockStyleIconWrapper,
  LeftButtonsWrapper,
  ListItem,
  PanelWrapper,
} from './blockList';

const theme = createTheme({ cssVariables: true });

function renderedCss() {
  return Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent ?? '')
    .join('');
}

describe('BlockList layout', () => {
  it('stacks the side columns below the lg breakpoint, where they would overflow the viewport', () => {
    render(
      <ThemeProvider theme={theme}>
        <ListItem>
          <LeftButtonsWrapper />
          <PanelWrapper />
          <BlockStyleIconWrapper />
        </ListItem>
      </ThemeProvider>
    );

    const css = renderedCss();

    expect(css).toContain(theme.breakpoints.down('lg'));
    expect(css).not.toContain('max-width: 899px');
    expect(css).not.toContain('max-width:899px');
  });
});
