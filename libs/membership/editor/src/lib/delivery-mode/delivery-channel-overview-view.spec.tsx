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
  });

  it('shows the people of a channel from its tile', () => {
    renderView();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'deliveryChannel.overview.showPeople',
      })[0]
    );

    expect(variablesOf('UsersByDeliveryChannel').at(-1)).toEqual(
      expect.objectContaining({ channel: 'mail', skip: 0 })
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

  it('points to the open suggestions of both directions', () => {
    renderView();

    expect(
      screen.getByText('deliveryChannel.overview.openSuggestions:{"count":3}')
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'deliveryChannel.overview.review' })
        .getAttribute('href')
    ).toBe('/deliverychannel/suggestions');
  });

  it('says how many automated messages are printed at all', () => {
    renderView();

    expect(
      screen.getByText(
        'deliveryChannel.overview.printed:{"printed":2,"total":3}'
      )
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'deliveryChannel.overview.openFlows' })
        .getAttribute('href')
    ).toBe('/communicationflows/edit/default');
  });

  it('leaves out the printed messages for people who may not see the flows', () => {
    allowed.mockImplementation(
      permission => permission !== 'CAN_GET_SUBSCRIPTION_FLOWS'
    );
    renderView();

    expect(screen.queryByText(/deliveryChannel\.overview\.printed/)).toBeNull();
    expect(
      queries.mock.calls.find(([name]) => name === 'SubscriptionFlows')?.[1]
    ).toEqual(expect.objectContaining({ skip: true }));
  });

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
