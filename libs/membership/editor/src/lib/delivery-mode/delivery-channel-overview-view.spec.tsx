import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliveryChannelOverviewView } from './delivery-channel-overview-view';

const queries = vi.fn();
const allowed = vi.fn((_permission: string) => true);

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: (permission: string) => allowed(permission),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const person = {
  user: { id: 'u1', email: 'jane@example.com', name: 'Doe', firstName: 'Jane' },
  channel: 'letter',
  origin: 'manual',
  reason: 'kept',
  changedAt: '2026-10-12T08:00:00.000Z',
  changedBy: { id: 'a1', email: 'a@x.ch', name: 'Admin', firstName: null },
  canReceiveLetters: true,
};

const interval = (sendAsLetter: boolean, withTemplate = true) => ({
  id: `${sendAsLetter}-${withTemplate}`,
  sendAsLetter,
  mailTemplate: withTemplate ? { id: 't', name: 'T' } : null,
});

const answer = (name: string) => {
  switch (name) {
    case 'DeliveryChannelCounts':
      return {
        data: {
          deliveryChannelCounts: [
            { channel: 'mail', userCount: 1100 },
            { channel: 'letter', userCount: 7 },
          ],
        },
      };
    case 'DeliverySuggestionCounts':
      return { data: { deliverySuggestionCounts: { toLetter: 2, toMail: 1 } } };
    case 'SubscriptionFlows':
      return {
        data: {
          subscriptionFlows: [
            { intervals: [interval(true), interval(false)] },
            { intervals: [interval(true), interval(true, false)] },
          ],
        },
      };
    case 'SystemMails':
      return {
        data: {
          systemMails: [
            { event: 'LOGIN_LINK', mailTemplate: { id: 't', name: 'T' } },
            { event: 'EMAIL_CHANGE', mailTemplate: { id: 't', name: 'T' } },
            { event: 'PASSWORD_RESET', mailTemplate: null },
            { event: 'TEST_MAIL', mailTemplate: { id: 't', name: 'T' } },
          ],
        },
      };
    case 'UsersByDeliveryChannel':
      return {
        data: { usersByDeliveryChannel: { nodes: [person], totalCount: 1 } },
        loading: false,
      };
    default:
      return {};
  }
};

const variablesOf = (name: string) =>
  queries.mock.calls
    .filter(([operation]) => operation === name)
    .map(([, options]) => (options as { variables?: unknown })?.variables);

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <DeliveryChannelOverviewView />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('DeliveryChannelOverviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    queries.mockImplementation((name: string) => answer(name));
  });

  afterEach(cleanup);

  it('counts the people on every channel and marks the default', () => {
    renderView();

    expect(
      screen.getByText(
        'deliveryChannel.overview.defaultChannel:{"label":"deliveryMode.channel.mail"}'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('deliveryChannel.overview.people:{"count":1100}')
    ).toBeTruthy();

    const letterTile = screen
      .getByText('deliveryChannel.overview.people:{"count":7}')
      .closest('.MuiCard-root') as HTMLElement;
    expect(
      within(letterTile).getByText('deliveryMode.channel.letter')
    ).toBeTruthy();
  });

  it('lists the people on letters first, with how they got there', () => {
    renderView();

    expect(variablesOf('UsersByDeliveryChannel')[0]).toEqual(
      expect.objectContaining({ channel: 'letter', skip: 0 })
    );
    expect(
      screen.getByRole('link', { name: /Jane Doe/ }).getAttribute('href')
    ).toBe('/users/edit/u1');
    expect(
      screen.getByText(
        /deliveryMode\.origin\.manual · deliveryMode\.reason\.kept · .* · Admin/
      )
    ).toBeTruthy();
    // The channel is plain text in the row, not a pill.
    const row = within(
      screen
        .getByRole('link', { name: /Jane Doe/ })
        .closest('tr') as HTMLElement
    );
    const channel = row.getByText('deliveryMode.channel.letter');
    expect(channel.closest('.MuiChip-root')).toBeNull();
    expect(channel.closest('td')?.querySelector('svg')).toBeNull();
  });

  it('shows the people of a channel from anywhere on its tile', () => {
    renderView();

    fireEvent.click(
      screen.getByText('deliveryChannel.overview.people:{"count":1100}')
    );

    expect(variablesOf('UsersByDeliveryChannel').at(-1)).toEqual(
      expect.objectContaining({ channel: 'mail', skip: 0 })
    );
  });

  it('marks the tile whose people are listed, and keeps every link a link', () => {
    renderView();
    const tileOf = (count: number) =>
      screen
        .getByText(`deliveryChannel.overview.people:{"count":${count}}`)
        .closest('.MuiCard-root') as HTMLElement;

    expect(tileOf(7).getAttribute('aria-current')).toBe('true');
    expect(tileOf(1100).getAttribute('aria-current')).toBeNull();

    fireEvent.click(
      within(tileOf(1100)).getByText('deliveryChannel.overview.channelHeading')
    );

    expect(tileOf(1100).getAttribute('aria-current')).toBe('true');
    expect(tileOf(7).getAttribute('aria-current')).toBeNull();
    // The tile is the button; the link text inside is only text.
    for (const text of screen.getAllByText(
      'deliveryChannel.overview.showPeople'
    )) {
      expect(text.closest('.MuiButton-root')).toBeNull();
    }
  });

  it('lets the reader choose how many people a page shows', () => {
    queries.mockImplementation((name: string) =>
      name === 'UsersByDeliveryChannel' ?
        {
          data: { usersByDeliveryChannel: { nodes: [person], totalCount: 45 } },
          loading: false,
        }
      : answer(name)
    );
    renderView();

    // A native select: change it straight to the size wanted.
    fireEvent.change(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' }),
      { target: { value: '50' } }
    );

    expect(variablesOf('UsersByDeliveryChannel').at(-1)).toEqual(
      expect.objectContaining({ skip: 0, take: 50 })
    );
  });

  it('searches the list by name or email address', () => {
    renderView();

    fireEvent.change(screen.getByLabelText('deliveryChannel.overview.search'), {
      target: { value: 'doe' },
    });

    expect(variablesOf('UsersByDeliveryChannel').at(-1)).toEqual(
      expect.objectContaining({ channel: 'letter', search: 'doe', skip: 0 })
    );
  });

  it('says what each tile is about', () => {
    renderView();

    expect(
      screen.getAllByText('deliveryChannel.overview.channelHeading')
    ).toHaveLength(2);
    const suggestions = screen
      .getByText('deliveryChannel.overview.suggestionsHeading')
      .closest('.MuiCard-root') as HTMLElement;
    expect(
      within(suggestions).getByText(
        'deliveryChannel.overview.openSuggestions:{"count":3}'
      )
    ).toBeTruthy();
  });

  it('pictures the suggestions as a move between the channels', () => {
    renderView();
    const suggestions = screen
      .getByText('deliveryChannel.overview.suggestionsHeading')
      .closest('.MuiCard-root') as HTMLElement;

    // Email, the swap, letter — the same icons the channel tiles use.
    expect(suggestions.querySelectorAll('svg')).toHaveLength(3);
  });

  it('points to the open suggestions of both directions', () => {
    renderView();

    expect(
      screen.getByText('deliveryChannel.overview.openSuggestions:{"count":3}')
    ).toBeTruthy();
    // The whole tile is the link.
    expect(
      screen
        .getByText('deliveryChannel.overview.suggestionsHeading')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('/deliverychannel/suggestions');
  });

  it('says per channel how many automated messages it covers', () => {
    renderView();
    const tileOf = (count: number) =>
      screen
        .getByText(`deliveryChannel.overview.people:{"count":${count}}`)
        .closest('.MuiCard-root') as HTMLElement;

    // Three subscription events and two account mails are configured (a
    // test mail is not a message to anyone); all go by email, only the two
    // printed subscription events by letter.
    expect(
      within(tileOf(1100)).getByText(
        'deliveryChannel.overview.activeFor:{"count":5}'
      )
    ).toBeTruthy();
    expect(
      within(tileOf(7)).getByText(
        'deliveryChannel.overview.activeFor:{"count":2}'
      )
    ).toBeTruthy();
    expect(
      screen.queryByText(/deliveryChannel\.overview\.openFlows/)
    ).toBeNull();
  });

  it.each(['CAN_GET_SUBSCRIPTION_FLOWS', 'CAN_GET_SYSTEM_MAILS'])(
    'leaves out the coverage for people who lack %s',
    missing => {
      allowed.mockImplementation(permission => permission !== missing);
      renderView();

      expect(
        screen.queryByText(/deliveryChannel\.overview\.activeFor/)
      ).toBeNull();
      for (const name of ['SubscriptionFlows', 'SystemMails']) {
        expect(
          queries.mock.calls.find(([operation]) => operation === name)?.[1]
        ).toEqual(expect.objectContaining({ skip: true }));
      }
    }
  );

  it('says so when nobody is on the channel', () => {
    queries.mockImplementation((name: string) =>
      name === 'UsersByDeliveryChannel' ?
        {
          data: { usersByDeliveryChannel: { nodes: [], totalCount: 0 } },
          loading: false,
        }
      : answer(name)
    );
    renderView();

    expect(screen.getByText('deliveryChannel.overview.empty')).toBeTruthy();
  });
});
