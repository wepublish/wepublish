import { createTheme, Theme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';

import { InvoiceState } from './invoice-state';
import { InvoiceStatusIcon } from './invoice-status-icon';

const editorTheme = createTheme({ cssVariables: true });
// The websites build their theme without CSS variables.
const websiteTheme = createTheme();

const pillOf = (theme: Theme, status: InvoiceState) => {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <InvoiceStatusIcon
        status={status}
        title={status}
      />
    </ThemeProvider>
  );

  const pill = container.querySelector('span > span');

  if (!pill) {
    throw new Error('no status pill rendered');
  }

  return pill;
};

describe('InvoiceStatusIcon', () => {
  it.each([
    ['paid', editorTheme.palette.success.main],
    ['canceled', editorTheme.palette.error.main],
    ['unpaid', editorTheme.palette.warning.main],
  ] as const)('paints the %s pill with a palette colour', (status, color) => {
    expect(getComputedStyle(pillOf(editorTheme, status)).backgroundColor).toBe(
      color
    );
  });

  it.each([
    ['paid', websiteTheme.palette.success.main],
    ['canceled', websiteTheme.palette.error.main],
    ['unpaid', websiteTheme.palette.warning.main],
  ] as const)(
    'paints the %s pill from a theme without CSS variables',
    (status, color) => {
      expect(
        getComputedStyle(pillOf(websiteTheme, status)).backgroundColor
      ).toBe(color);
    }
  );
});
