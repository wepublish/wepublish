import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import { ProductType } from '@wepublish/website/api';

import { SubscriptionHistory } from './subscription-history';
import * as fixtures from './subscription-history.fixtures';
import { SubscriptionHistoryFixture } from './subscription-history.fixtures';

const { Default, Empty } = fixtures;

const renderStory = async (
  { props, mocks }: SubscriptionHistoryFixture,
  options?: RenderWithProvidersOptions
) => {
  renderWithProviders(<SubscriptionHistory {...props} />, {
    mocks,
    ...options,
  });
  await actWait(100);
};

const subscriptionRow = (planName: string) => {
  const row = screen.getByRole('rowheader', { name: planName }).closest('tr');

  if (!row) {
    throw new Error(`no row for ${planName}`);
  }

  return row;
};

// a closed subscription keeps its invoices in the table, marked collapsed:
// the table hides them, the stacked layout always shows them
const invoiceRow = (text: string) =>
  screen.getByText(text).closest('tr') as HTMLElement;
const expectShown = (text: string) =>
  expect(invoiceRow(text)).not.toHaveAttribute('data-collapsed');
const expectCollapsed = (text: string) =>
  expect(invoiceRow(text)).toHaveAttribute('data-collapsed', 'true');

describe('SubscriptionHistory', () => {
  describe('of donations', () => {
    // the same subscriptions, as donations
    const renderDonations = () =>
      renderStory({
        ...Default,
        props: {
          ...Default.props,
          type: ProductType.Donation,
          data: {
            ...Default.props.data,
            userSubscriptions: (
              Default.props.data?.userSubscriptions ?? []
            ).map(subscription => ({
              ...subscription,
              memberPlan: {
                ...subscription.memberPlan,
                productType: ProductType.Donation,
              },
            })),
          },
        },
      });

    it('names them donations', async () => {
      await renderDonations();

      expect(
        screen.getByRole('columnheader', { name: 'Spende' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('columnheader', { name: 'Abo' })
      ).not.toBeInTheDocument();
      expect(
        screen.getAllByRole('link', { name: 'Spende anpassen' }).length
      ).toBeGreaterThan(0);
      expect(
        screen.queryByRole('link', { name: 'Abo anpassen' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Beendete Spenden \(\d+\)$/ })
      ).toBeInTheDocument();
    });

    it('offers no other subscription below them', async () => {
      await renderDonations();

      expect(
        screen.queryByRole('link', { name: 'Anderes Abo lösen' })
      ).not.toBeInTheDocument();
    });
  });

  for (const [name, fixture] of [
    ['Default', Default],
    ['Empty', Empty],
  ] as const) {
    it(`should render ${name}`, async () => {
      await renderStory(fixture);
    });
  }

  it('lists running subscriptions with their state, ended ones on request', async () => {
    await renderStory(Default);

    expect(
      within(subscriptionRow('Förderabo')).getByText('Aktiv')
    ).toBeInTheDocument();
    expect(
      within(subscriptionRow('Jahresabo')).getByText('Abgelaufen')
    ).toBeInTheDocument();
    expect(screen.queryByText('Probeabo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Beendete Abos (1)' }));

    expect(
      within(subscriptionRow('Probeabo')).getByText('Gekündigt')
    ).toBeInTheDocument();
  });

  it('opens the invoices of a subscription with an open invoice', async () => {
    await renderStory(Default);

    expectShown('Jahresabo 2026');
    expectCollapsed('Förderabo 2026');
  });

  it('shows the latest invoices and links to all of them on the edit page', async () => {
    await renderStory(Default);

    expectShown('Jahresabo 2025');
    expect(screen.queryByText('Jahresabo 2024')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Alle Rechnungen (3)' })
    ).toHaveAttribute('href', '/profile/subscription/yearly');
  });

  it('names the payment method the way readers know it', async () => {
    await renderStory(Default);

    const row = subscriptionRow('Jahresabo');
    expect(row).toHaveTextContent('Online-Zahlung');
    expect(row).not.toHaveTextContent('Payrexx');
  });

  it('groups each subscription with its actions and invoices, a box when stacked', async () => {
    await renderStory(Default);

    const body = subscriptionRow('Jahresabo').closest('tbody') as HTMLElement;
    expect(body).toContainElement(
      subscriptionRow('Jahresabo').nextElementSibling as HTMLElement
    );
    expect(body).toContainElement(invoiceRow('Jahresabo 2026'));
    expect(body).not.toContainElement(subscriptionRow('Förderabo'));
    expect(body).not.toContainElement(invoiceRow('Förderabo 2026'));
  });

  it('opens and closes the invoices of a subscription on request', async () => {
    await renderStory(Default);

    fireEvent.click(
      within(subscriptionRow('Förderabo')).getByRole('button', {
        name: 'Rechnungen anzeigen',
      })
    );
    await actWait(50);
    expectShown('Förderabo 2026');

    fireEvent.click(
      within(subscriptionRow('Jahresabo')).getByRole('button', {
        name: 'Rechnungen ausblenden',
      })
    );
    expectCollapsed('Jahresabo 2026');
  });

  it('offers the immediate actions of every running subscription without opening it', async () => {
    await renderStory(Default);

    // Jahresabo is opened (open invoice), Förderabo is not
    expectCollapsed('Förderabo 2026');
    expect(
      screen.getAllByRole('button', { name: 'Jetzt verlängern' })
    ).toHaveLength(2);
  });

  it('leaves cancelling and the payment method to the edit page', async () => {
    await renderStory(Default);

    for (const name of [
      'Abo kündigen',
      'Zahlungsmethode anpassen',
      'Bestehende Zahlungsmethode aktualisieren',
    ]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it('says so when there is no subscription yet', async () => {
    await renderStory(Empty);

    expect(screen.getByText('Du hast noch kein Abo.')).toBeInTheDocument();
  });

  it('tells when a cancelled subscription ends on hovering its state', async () => {
    await renderStory(Default);
    fireEvent.click(screen.getByRole('button', { name: 'Beendete Abos (1)' }));

    const row = subscriptionRow('Probeabo');
    expect(row.textContent).not.toMatch(/per /);

    fireEvent.mouseOver(within(row).getByText('Gekündigt'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /^Gekündigt per /
    );
  });

  it('shows dates without the time of day', async () => {
    const format = vi.fn((date: Date) => date.toISOString());
    await renderStory(Default, { builder: { date: { format } } });

    expect(format).toHaveBeenCalled();
    for (const [, includeTime] of format.mock.calls as unknown as [
      Date,
      boolean?,
    ][]) {
      expect(includeTime).toBe(false);
    }
  });

  it('offers another subscription in the table, aligned with its actions', async () => {
    await renderStory(Default);

    const subscribe = screen.getByRole('link', { name: 'Anderes Abo lösen' });
    expect(subscribe.closest('table')).not.toBeNull();
    expect(subscribe).toHaveAttribute('href', '/mitmachen');
  });

  it('sets another subscription apart from the actions', async () => {
    await renderStory(Default);

    expect(screen.getByRole('link', { name: 'Anderes Abo lösen' })).toHaveClass(
      'MuiButton-colorAccent'
    );
  });

  it('draws no line below another subscription', async () => {
    await renderStory(Default);

    const cell = screen
      .getByRole('link', { name: 'Anderes Abo lösen' })
      .closest('td') as HTMLElement;
    expect(getComputedStyle(cell).borderBottomStyle).toBe('none');
  });

  it('offers no other subscription while there is none', async () => {
    await renderStory(Empty);

    expect(
      screen.queryByRole('link', { name: 'Anderes Abo lösen' })
    ).not.toBeInTheDocument();
  });

  it('shows the invoices as rows of the same table, under the matching columns', async () => {
    await renderStory(Default);

    const table = screen
      .getByRole('rowheader', { name: 'Jahresabo' })
      .closest('table');
    const invoiceRow = screen
      .getByText('Jahresabo 2026')
      .closest('tr') as HTMLTableRowElement;
    expect(invoiceRow.closest('table')).toBe(table);

    const headers = [...(table?.querySelectorAll('thead th') ?? [])].map(
      cell => cell.textContent
    );
    const columnOf = (text: string) =>
      headers[
        [...invoiceRow.cells].findIndex(cell =>
          cell.textContent?.includes(text)
        )
      ];

    expect(columnOf('Offen')).toBe('Status');
    expect(columnOf('CHF')).toBe('Betrag');
    // created under the start, due under paid-until
    expect(
      headers[
        [...invoiceRow.cells].findIndex(cell => cell.querySelector('time'))
      ]
    ).toBe('Beginn');
  });

  it('has each date in a long and a short form, for narrower tables', async () => {
    await renderStory(Default);

    const start = within(subscriptionRow('Jahresabo')).getAllByRole('time')[0];
    expect(start).toHaveAttribute('datetime', '2024-01-01T00:00:00.000Z');
    expect(start.querySelector('[data-date="short"]')).toHaveTextContent(
      '01.01.2024'
    );
    expect(start.querySelector('[data-date="long"]')).not.toBeNull();
  });

  it('never wraps a date', async () => {
    await renderStory(Default);

    const dates = subscriptionRow('Jahresabo').querySelectorAll('time');
    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) {
      expect(getComputedStyle(date).whiteSpace).toBe('nowrap');
    }
  });

  it('gives the plan column more room on the left, and lines the invoices up with it', async () => {
    await renderStory(Default);

    const padding = (cell: Element | null | undefined) =>
      parseFloat(getComputedStyle(cell as HTMLElement).paddingLeft || '0');
    const planCell = screen.getByRole('rowheader', { name: 'Jahresabo' });
    const statusCell = within(subscriptionRow('Jahresabo'))
      .getByText('Abgelaufen')
      .closest('td');
    const invoiceCell = screen.getByText('Jahresabo 2026').closest('td');
    const planHeader = screen.getByRole('columnheader', { name: 'Abo' });

    expect(padding(planCell)).toBeGreaterThan(padding(statusCell));
    expect(padding(planHeader)).toBe(padding(planCell));
    expect(padding(invoiceCell)).toBe(padding(planCell));
  });

  describe('clicking the data of a subscription', () => {
    const statusCell = (planName: string, state: string) =>
      within(subscriptionRow(planName))
        .getByText(state)
        .closest('td') as HTMLElement;

    afterEach(() => vi.restoreAllMocks());

    it('opens and closes its invoices', async () => {
      await renderStory(Default);

      fireEvent.click(statusCell('Förderabo', 'Aktiv'));
      await actWait(50);
      expectShown('Förderabo 2026');

      fireEvent.click(statusCell('Förderabo', 'Aktiv'));
      expectCollapsed('Förderabo 2026');
    });

    it('leaves the edit link and the arrow to themselves', async () => {
      await renderStory(Default);

      fireEvent.click(
        within(
          subscriptionRow('Förderabo').nextElementSibling as HTMLElement
        ).getByRole('link', { name: 'Abo anpassen' })
      );
      expectCollapsed('Förderabo 2026');

      // the arrow opens once, the row does not toggle it back
      fireEvent.click(
        within(subscriptionRow('Förderabo')).getByRole('button', {
          name: 'Rechnungen anzeigen',
        })
      );
      await actWait(50);
      expectShown('Förderabo 2026');
    });

    it('does not toggle while text in it is selected', async () => {
      await renderStory(Default);
      vi.spyOn(window, 'getSelection').mockReturnValue({
        toString: () => '07. Oktober 2026',
      } as Selection);

      fireEvent.click(statusCell('Förderabo', 'Aktiv'));
      expectCollapsed('Förderabo 2026');
    });

    it('shows a pointer on the whole block, data and actions', async () => {
      await renderStory(Default);

      const dataRow = subscriptionRow('Förderabo');
      const actionRow = dataRow.nextElementSibling as HTMLElement;
      expect(getComputedStyle(dataRow).cursor).toBe('pointer');
      expect(getComputedStyle(actionRow).cursor).toBe('pointer');
    });

    it('opens the invoices from the free part of the action row', async () => {
      await renderStory(Default);

      const actionCell = (
        subscriptionRow('Förderabo').nextElementSibling as HTMLElement
      ).querySelector('td') as HTMLElement;
      fireEvent.click(actionCell);
      await actWait(50);
      expectShown('Förderabo 2026');
    });

    it('leaves the action buttons to themselves', async () => {
      await renderStory(Default);

      const actionRow = subscriptionRow('Förderabo')
        .nextElementSibling as HTMLElement;
      fireEvent.click(
        within(actionRow).getByRole('button', { name: 'Jetzt verlängern' })
      );
      expectCollapsed('Förderabo 2026');
    });
  });

  it('shows the plan as bold text, not as a link', async () => {
    await renderStory(Default);

    const plan = screen.getByRole('rowheader', { name: 'Förderabo' });
    expect(within(plan).queryByRole('link')).not.toBeInTheDocument();
    expect(
      Number(getComputedStyle(within(plan).getByText('Förderabo')).fontWeight)
    ).toBeGreaterThanOrEqual(700);
  });

  it('offers editing first in the action row, without a column of its own', async () => {
    await renderStory(Default);

    expect(
      screen.getAllByRole('columnheader').map(cell => cell.textContent)
    ).not.toContain('Aktion');

    const row = subscriptionRow('Förderabo');
    const actionRow = row.nextElementSibling as HTMLElement;
    expect(
      within(row).queryByRole('link', { name: 'Abo anpassen' })
    ).not.toBeInTheDocument();

    const edit = within(actionRow).getByRole('link', {
      name: 'Abo anpassen',
    });
    expect(edit).toHaveAttribute(
      'href',
      'https://example.com/profile/subscription/subscription-1'
    );
    // secondary, always at the far right: the subscription's own actions,
    // which only some rows have, come before it
    expect(edit.className).toMatch(/MuiButton-outlined/);
    expect(
      getComputedStyle(edit.parentElement as HTMLElement).justifyContent
    ).toBe('flex-end');
    const extend = within(actionRow).getByRole('button', {
      name: 'Jetzt verlängern',
    });
    expect(
      edit.compareDocumentPosition(extend) & Node.DOCUMENT_POSITION_PRECEDING
    ).toBeTruthy();
    expect(edit.parentElement?.lastElementChild).toBe(edit);
  });

  it('lines the edit button up with the actions on their text', async () => {
    await renderStory(Default);

    const edit = within(
      subscriptionRow('Förderabo').nextElementSibling as HTMLElement
    ).getByRole('link', { name: 'Abo anpassen' });

    // a button, a link and a note above a button are of different heights
    expect(getComputedStyle(edit.parentElement as HTMLElement).alignItems).toBe(
      'baseline'
    );
  });

  it('draws the edit button in the text colour, whatever the primary colour', async () => {
    await renderStory(Default);

    const edit = within(
      subscriptionRow('Förderabo').nextElementSibling as HTMLElement
    ).getByRole('link', { name: 'Abo anpassen' });
    const text = getComputedStyle(
      screen.getByRole('rowheader', { name: 'Förderabo' })
    ).color;

    expect(getComputedStyle(edit).color).toBe(text);
    expect(getComputedStyle(edit).borderColor).toMatch(
      /^(currentcolor|currentColor)$/
    );
  });

  it('changes the payment method from an early extension by name, like the edit page', async () => {
    await renderStory(Default);
    const user = userEvent.setup();

    const actionRow = subscriptionRow('Jahresabo')
      .nextElementSibling as HTMLElement;
    await user.click(
      within(actionRow).getByRole('button', { name: 'Jetzt verlängern' })
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Zahlungsmethode anpassen',
      })
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      'Aktuelle Zahlungsmethode: Online-Zahlung'
    );
    expect(dialog.querySelector('img')).toBeNull();
  });

  it('offers editing also where there is nothing else to do', async () => {
    // running, and too early to extend: no immediate action
    await renderStory({
      ...Default,
      props: {
        ...Default.props,
        data: {
          __typename: 'Query',
          userSubscriptions: (Default.props.data?.userSubscriptions ?? [])
            .filter(({ memberPlan }) => memberPlan.name === 'Förderabo')
            .map(subscription => ({ ...subscription, canExtend: false })),
        },
      },
    });

    const actionRow = subscriptionRow('Förderabo')
      .nextElementSibling as HTMLElement;
    expect(within(actionRow).queryAllByRole('button')).toHaveLength(0);
    expect(
      within(actionRow).getByRole('link', { name: 'Abo anpassen' })
    ).toBeInTheDocument();
  });

  it('keeps the arrow column narrow, on both levels', async () => {
    await renderStory(Default);

    const firstCells = [
      screen.getAllByRole('columnheader')[0],
      subscriptionRow('Jahresabo').cells[0],
      (screen.getByText('Jahresabo 2026').closest('tr') as HTMLTableRowElement)
        .cells[0],
    ];
    for (const cell of firstCells) {
      expect(getComputedStyle(cell).paddingRight).toBe('0px');
    }
  });
});
