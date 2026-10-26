import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { InvoiceStatus, InvoiceStatusIcon } from './invoiceStatusIcon';

const theme = createTheme({ cssVariables: true });

const pillOf = (status: InvoiceStatus) => {
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

describe('InvoiceStatusIcon for keyboard and screen reader users', () => {
  it('exposes its status as a named image a keyboard can reach', () => {
    render(
      <ThemeProvider theme={theme}>
        <InvoiceStatusIcon
          status="canceled"
          title="Canceled at 7.10.2026"
        />
      </ThemeProvider>
    );

    const icon = screen.getByRole('img', { name: 'Canceled at 7.10.2026' });

    expect(icon).toHaveAttribute('tabindex', '0');
  });
});

describe('InvoiceStatusIcon', () => {
  it.each([
    ['paid', theme.palette.success.main],
    ['canceled', theme.palette.error.main],
    ['unpaid', theme.palette.warning.main],
  ] as const)('paints the %s pill with a palette colour', (status, color) => {
    expect(getComputedStyle(pillOf(status)).backgroundColor).toBe(color);
  });
});
