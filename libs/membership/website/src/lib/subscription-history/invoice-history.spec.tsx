import { TableBody } from '@mui/material';
import { act, fireEvent, screen } from '@testing-library/react';
import {
  renderWithProviders,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';

import { HistoryTable } from './history-table';
import { InvoiceHistory, InvoiceHistoryProps } from './invoice-history';
import * as fixtures from './invoice-history.fixtures';

const { Default, Standalone, Latest, WithBexio, Empty } = fixtures;

// the invoices are rows of the subscription history's table
const renderHistory = (
  props: InvoiceHistoryProps,
  options?: RenderWithProvidersOptions
) =>
  renderWithProviders(
    <HistoryTable>
      <TableBody>
        <InvoiceHistory {...props} />
      </TableBody>
    </HistoryTable>,
    options
  );

const rowTexts = () =>
  screen
    .getAllByRole('row')
    .slice(1) // the header
    .map(row => row.textContent ?? '');

describe('InvoiceHistory', () => {
  Object.entries(fixtures).forEach(([name, props]) => {
    it(`should render ${name}`, () => {
      renderHistory(props);
    });
  });

  it('lists the newest invoice first and leaves cancelled ones out', () => {
    renderHistory(Default);

    const rows = rowTexts();
    expect(rows[0]).toContain('Jahresabo 2026');
    expect(rows[1]).toContain('Jahresabo 2025');
    expect(rows[2]).toContain('Jahresabo 2024');
    expect(rows.join()).not.toContain('(storniert)');
  });

  it('shows the cancelled invoices on request', () => {
    renderHistory(Default);

    fireEvent.click(
      screen.getByRole('button', { name: 'Stornierte Rechnungen anzeigen (1)' })
    );

    expect(rowTexts().join()).toContain('(storniert)');
    expect(
      screen.getByRole('button', { name: 'Stornierte Rechnungen ausblenden' })
    ).toBeInTheDocument();
  });

  it('shows each state, with its date on hovering the icon', async () => {
    renderHistory(Default);

    const rows = rowTexts();
    expect(rows[0]).toContain('Offen');
    expect(rows[1]).toContain('Bezahlt');
    expect(rows[1]).not.toMatch(/Bezahlt am/);

    const paidRow = screen.getAllByRole('row')[2];
    const statusIcon = paidRow
      .querySelector('td svg:not([aria-hidden])')
      ?.closest('span') as HTMLElement;
    fireEvent.mouseOver(statusIcon);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /^Bezahlt am /
    );
  });

  it('pays an open invoice with the payment method of its subscription', async () => {
    const onPay = vi.fn(async () => undefined);
    renderHistory({ ...Default, onPay });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Jetzt Bezahlen' }));
    });

    expect(onPay).toHaveBeenCalledWith('open-2026', 'payrexx');
  });

  it('explains bexio invoices instead of offering to pay them', () => {
    renderHistory(WithBexio);

    expect(
      screen.queryByRole('button', { name: 'Jetzt Bezahlen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Du erhältst eine PDF-Rechnung per E-Mail zugeschickt.')
    ).toBeInTheDocument();
  });

  it('says so when there are no invoices yet', () => {
    renderHistory(Empty);

    expect(screen.getByText('Noch keine Rechnungen')).toBeInTheDocument();
  });

  it('shows dates without the time of day', async () => {
    const format = vi.fn((date: Date) => date.toISOString());
    renderHistory(Default, { builder: { date: { format } } });

    expect(format).toHaveBeenCalled();
    for (const [, includeTime] of format.mock.calls as unknown as [
      Date,
      boolean?,
    ][]) {
      expect(includeTime).toBe(false);
    }
  });

  it('marks every invoice as nested in its subscription', () => {
    renderHistory(Default);

    // the invoice rows, not the toggle for cancelled ones
    const rows = screen
      .getAllByRole('row')
      .filter(row => row.textContent?.includes('Jahresabo'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const invoiceCell = [...row.querySelectorAll('td')].find(cell =>
        cell.textContent?.includes('Jahresabo')
      );
      expect(
        invoiceCell?.querySelector('svg[aria-hidden="true"]')
      ).not.toBeNull();
    }
  });

  it('cuts long invoice labels short, with the full label on hovering it', () => {
    renderHistory(Default);

    const label = screen.getByTitle('Jahresabo 2026');
    expect(label).toHaveTextContent('Jahresabo 2026');
    const style = getComputedStyle(label);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.overflow).toBe('hidden');
  });

  it('labels the invoice columns in the order of the subscription columns', () => {
    renderHistory(Default);

    const header = screen.getAllByRole('row')[0];
    expect(
      [...header.querySelectorAll('th')].map(cell => cell.textContent)
    ).toEqual([
      '',
      'Rechnung',
      '',
      'Status',
      'Erstellt am',
      'Fällig am',
      'Betrag',
      '',
    ]);
  });

  it('puts each value under its column', () => {
    renderHistory(Default);

    const columns = [
      ...screen.getAllByRole('row')[0].querySelectorAll('th'),
    ].map(cell => cell.textContent);
    const row = screen.getAllByRole('row')[1];
    const columnOf = (text: string | RegExp) =>
      columns[
        [...row.querySelectorAll('td')].findIndex(cell =>
          typeof text === 'string' ?
            cell.textContent?.includes(text)
          : text.test(cell.textContent ?? '')
        )
      ];

    expect(columnOf('Jahresabo 2026')).toBe('Rechnung');
    expect(columnOf('Offen')).toBe('Status');
    expect(columnOf(/CHF/)).toBe('Betrag');
  });

  it('indents the invoice under its subscription, with the column label in line', () => {
    renderHistory(Default);

    const [header, row] = screen.getAllByRole('row');
    const padding = (cell: Element | null | undefined) =>
      parseFloat(getComputedStyle(cell as HTMLElement).paddingLeft || '0');
    const invoiceCell = [...row.querySelectorAll('td')].find(cell =>
      cell.textContent?.includes('Jahresabo')
    );
    const statusCell = [...row.querySelectorAll('td')].find(cell =>
      cell.textContent?.includes('Offen')
    );
    const invoiceLabel = [...header.querySelectorAll('th')].find(
      cell => cell.textContent === 'Rechnung'
    );

    expect(padding(invoiceCell)).toBeGreaterThan(padding(statusCell));
    expect(padding(invoiceLabel)).toBe(padding(invoiceCell));
  });

  it('leaves the arrow column of the invoice labels without a background', () => {
    renderHistory(Default);

    const [arrowColumn, invoiceColumn] = screen
      .getAllByRole('row')[0]
      .querySelectorAll('th');
    const background = (cell: Element) =>
      getComputedStyle(cell as HTMLElement).backgroundColor;

    expect(background(invoiceColumn)).not.toMatch(
      /^(|transparent|rgba\(0, 0, 0, 0\))$/
    );
    expect(background(arrowColumn)).toMatch(
      /^(|transparent|rgba\(0, 0, 0, 0\))$/
    );
  });

  it('draws no line below the arrow column of the invoice labels', () => {
    renderHistory(Default);

    const [arrowColumn] = screen.getAllByRole('row')[0].querySelectorAll('th');
    expect(getComputedStyle(arrowColumn as HTMLElement).borderBottomStyle).toBe(
      'none'
    );
  });

  it('starts the background of the invoice label just before the label', () => {
    renderHistory(Default);

    const invoiceLabel = [
      ...screen.getAllByRole('row')[0].querySelectorAll('th'),
    ].find(cell => cell.textContent === 'Rechnung') as HTMLElement;
    const style = getComputedStyle(invoiceLabel);

    // its line is part of the offset background (jsdom does not parse
    // layered gradients, so where the background starts is measured in a
    // browser)
    expect(style.borderBottomStyle).toBe('none');
  });

  it('stands alone on a subscription page: no arrow, no spacer columns', () => {
    renderHistory(Standalone);

    const [header, ...rows] = screen.getAllByRole('row');
    expect(
      [...header.querySelectorAll('th')].map(cell => cell.textContent)
    ).toEqual(['Rechnung', 'Status', 'Erstellt am', 'Fällig am', 'Betrag', '']);
    expect(rows[0].querySelector('svg[aria-hidden="true"]')).toBeNull();
  });

  it('gives every label of a standalone list the same background and line', () => {
    renderHistory(Standalone);

    const [invoiceColumn, stateColumn] = screen
      .getAllByRole('row')[0]
      .querySelectorAll('th');

    for (const cell of [invoiceColumn, stateColumn]) {
      const style = getComputedStyle(cell as HTMLElement);
      expect(style.backgroundColor).not.toMatch(
        /^(|transparent|rgba\(0, 0, 0, 0\))$/
      );
      expect(style.borderBottomStyle).not.toBe('none');
    }
  });

  describe('in the profile', () => {
    it('shows the latest two invoices and older open ones', () => {
      renderHistory(Latest);

      const rows = rowTexts().join();
      expect(rows).toContain('Jahresabo 2026');
      expect(rows).toContain('Jahresabo 2025');
      expect(rows).toContain('Jahresabo 2023'); // open, so it can be paid
      expect(rows).not.toContain('Jahresabo 2024');
      expect(rows).not.toContain('(storniert)');
    });

    it('links to all invoices on the edit page instead of the cancelled toggle', () => {
      renderHistory(Latest);

      expect(
        screen.getByRole('link', { name: 'Alle Rechnungen (5)' })
      ).toHaveAttribute('href', '/profile/subscription/subscription-1');
      expect(
        screen.queryByRole('button', { name: /Stornierte Rechnungen/ })
      ).not.toBeInTheDocument();
    });

    it('needs no link while nothing is left out', () => {
      renderHistory({
        ...Latest,
        data: {
          __typename: 'Query',
          userInvoices: (Latest.data?.userInvoices ?? []).filter(({ id }) =>
            ['open-2026', 'paid-2025'].includes(id)
          ),
        },
      });

      expect(
        screen.queryByRole('link', { name: /Alle Rechnungen/ })
      ).not.toBeInTheDocument();
    });
  });
});
