import { createTheme, ThemeProvider } from '@mui/material';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DeliveryChannelAssignView } from './delivery-channel-assign-view';

const queries = vi.fn();
const mutate = vi.fn();
const mutationOptions = vi.fn();
const filterProps = vi.fn();
const letterChannel = vi.fn(() => ({
  paperLetters: true,
  letterAvailable: true,
}));

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: (document: unknown, options?: unknown) => {
    mutationOptions(operationName(document), options);

    return [
      (callOptions?: unknown) => mutate(operationName(document), callOptions),
      { loading: false },
    ];
  },
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
  enqueueSnackbar: vi.fn(),
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => letterChannel(),
}));

// The filter is covered on its own; here a button stands in for a change.
vi.mock('../mail-send/audience/audience-filter', () => ({
  AudienceFilter: (props: any) => {
    filterProps(props);

    return (
      <button onClick={() => props.onChange({ emailSegments: ['dead'] })}>
        narrow
      </button>
    );
  },
}));

vi.mock('./use-audience-lookups', () => ({
  useAudienceLookups: () => ({
    t: (key: string) => key,
    memberPlans: new Map(),
    paymentMethods: new Map(),
    templates: new Map(),
    formatDate: (iso: string) => iso,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

let preview = { userCount: 12, withoutAddressCount: 3, segments: [] };

const answer = (name: string) =>
  name === 'DeliveryModeAudiencePreview' ?
    {
      data: { deliveryModeAudiencePreview: preview },
      loading: false,
      refetch: vi.fn(),
    }
  : {};

const renderView = (state?: unknown) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter
        initialEntries={[{ pathname: '/deliverychannel/assign', state }]}
      >
        <Routes>
          <Route
            path="/deliverychannel/assign"
            element={<DeliveryChannelAssignView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const next = () =>
  fireEvent.click(screen.getByRole('button', { name: 'mailSend.next' }));
const pick = (channel: string) =>
  fireEvent.click(screen.getByRole('radio', { name: channel }));

const previewCalls = () =>
  queries.mock.calls
    .filter(([name]) => name === 'DeliveryModeAudiencePreview')
    .map(([, options]) => options);

describe('DeliveryChannelAssignView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview = { userCount: 12, withoutAddressCount: 3, segments: [] };
    queries.mockImplementation(answer);
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });
  });

  afterEach(cleanup);

  it('walks audience, channel, review', () => {
    renderView();

    // Each step is numbered by the stepper itself.
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual([
      '1deliveryChannel.assign.steps.audience.titledeliveryChannel.assign.steps.audience.description',
      '2deliveryChannel.assign.steps.channel.titledeliveryChannel.assign.steps.channel.description',
      '3deliveryChannel.assign.steps.review.titledeliveryChannel.assign.steps.review.description',
    ]);
  });

  it('counts the audience per person and goes on only with someone in it', () => {
    preview = { userCount: 0, withoutAddressCount: 0, segments: [] };
    renderView();

    expect(
      screen.getByText('deliveryChannel.assign.people:{"count":0}')
    ).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'mailSend.next',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it('speaks of users, not recipients: nothing is sent here', () => {
    renderView();

    expect(
      screen.getByRole('button', {
        name: 'deliveryChannel.overview.showPeople',
      })
    ).toBeTruthy();
    expect(screen.queryByText(/mailSend\.showRecipients/)).toBeNull();
  });

  it('explains a missing address in its own terms inside the list', () => {
    queries.mockImplementation((name: string) =>
      name === 'MailSendRecipients' ?
        {
          data: {
            mailSendRecipients: {
              nodes: [
                {
                  id: 'r1',
                  email: 'jane@example.com',
                  name: 'Doe',
                  firstName: 'Jane',
                  memberPlanName: null,
                  emailSegment: 'dead',
                  hasAddress: false,
                },
              ],
              totalCount: 1,
            },
          },
          loading: false,
        }
      : answer(name)
    );
    renderView();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'deliveryChannel.overview.showPeople',
      })
    );

    expect(screen.getByTitle('deliveryMode.noAddress')).toBeTruthy();
    expect(
      screen.queryByTitle('mailSend.recipientList.withoutAddress')
    ).toBeNull();
  });

  it('heads the filter as filtering the user group, and lets the filter drop its own label', () => {
    renderView();

    expect(screen.getByText('deliveryChannel.assign.filterTitle')).toBeTruthy();
    expect(filterProps.mock.calls[0][0].baseLabel).toBeNull();
  });

  it('starts from the audience the send page hands over', () => {
    renderView({ audience: { emailSegments: ['placeholder'] } });

    expect(filterProps.mock.calls[0][0].state).toEqual(
      expect.objectContaining({ emailSegments: ['placeholder'] })
    );
  });

  it('offers every channel of the medium, then previews the pick fresh', () => {
    renderView();
    next();

    expect(
      screen.getByRole('radio', { name: 'deliveryMode.channel.mail' })
    ).toBeTruthy();
    pick('deliveryMode.channel.letter');

    const last = previewCalls().at(-1);
    expect(last).toEqual(
      expect.objectContaining({
        variables: expect.objectContaining({ channel: 'letter' }),
        fetchPolicy: 'network-only',
      })
    );
    expect(
      screen.getByText('deliveryChannel.assign.noAddress:{"count":3}')
    ).toBeTruthy();
  });

  it('warns, but does not refuse, when email will not reach some of them', () => {
    preview = {
      userCount: 12,
      withoutAddressCount: 0,
      segments: [
        { segment: 'placeholder', userCount: 3 },
        { segment: 'dead', userCount: 2 },
        { segment: 'active', userCount: 7 },
      ],
    };
    renderView();
    next();
    pick('deliveryMode.channel.mail');

    expect(
      screen.getByText('deliveryChannel.assign.unreachableEmail:{"count":5}')
    ).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'mailSend.next',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);

    // Letters are about the postal address, not the mailbox.
    pick('deliveryMode.channel.letter');
    expect(
      screen.queryByText(/deliveryChannel\.assign\.unreachableEmail/)
    ).toBeNull();
  });

  it('offers no letters where none can be sent', () => {
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: false,
    });
    renderView();
    next();

    expect(
      screen.queryByRole('radio', { name: 'deliveryMode.channel.letter' })
    ).toBeNull();
  });

  it('sums up the switch and asks once more before doing it', () => {
    renderView();
    next();
    pick('deliveryMode.channel.letter');
    next();

    expect(
      screen.getByText(
        'deliveryChannel.assign.summary.letter:{"changed":9,"skipped":3}'
      )
    ).toBeTruthy();
    expect(screen.getByText('mailSend.base.allUsers')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.audience.apply' })
    );
    expect(mutate).not.toHaveBeenCalled();

    const dialog = within(screen.getByRole('dialog'));
    expect(
      dialog.getByText(
        'deliveryChannel.assign.confirmTitle:{"channel":"deliveryMode.channel.letter"}'
      )
    ).toBeTruthy();
    fireEvent.click(
      dialog.getByRole('button', { name: 'deliveryMode.audience.apply' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'SetDeliveryModeForAudience',
      expect.objectContaining({
        variables: expect.objectContaining({ channel: 'letter' }),
      })
    );
  });

  it('holds the switch back while the audience changed under the preview', () => {
    renderView();
    next();
    pick('deliveryMode.channel.letter');
    next();

    // Back to the audience, narrow it, straight to review while the preview
    // for the new audience is still on its way.
    fireEvent.click(screen.getByRole('button', { name: 'mailSend.back' }));
    fireEvent.click(screen.getByRole('button', { name: 'mailSend.back' }));
    queries.mockImplementation((name: string) =>
      name === 'DeliveryModeAudiencePreview' ?
        { data: undefined, loading: true, refetch: vi.fn() }
      : {}
    );
    fireEvent.click(screen.getByRole('button', { name: 'narrow' }));

    expect(
      (
        screen.getByRole('button', {
          name: 'mailSend.next',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it('reports the result, points to the history and locks the steps', () => {
    renderView();
    next();
    pick('deliveryMode.channel.letter');
    next();
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.audience.apply' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'deliveryMode.audience.apply',
      })
    );

    const { onCompleted } = mutationOptions.mock.calls.find(
      ([name]) => name === 'SetDeliveryModeForAudience'
    )[1];
    act(() =>
      onCompleted({
        setDeliveryModeForAudience: { changed: 9, skippedWithoutAddress: 3 },
      })
    );

    expect(
      screen.getByText(
        'deliveryMode.audience.done.letter:{"changed":9,"skippedWithoutAddress":3}'
      )
    ).toBeTruthy();
    // The confirm dialog is still fading out and keeps the page aria-hidden,
    // so the queries look past that.
    expect(
      screen
        .getByRole('link', {
          name: 'deliveryChannel.assign.showHistory',
          hidden: true,
        })
        .getAttribute('href')
    ).toBe('/deliverychannel/history');
    // Locked: the earlier steps cannot be reopened, only the current stays lit.
    expect(
      screen
        .getAllByRole('tab', { hidden: true })
        .map(tab => (tab as HTMLButtonElement).disabled)
    ).toEqual([true, true, false]);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'deliveryChannel.assign.again',
        hidden: true,
      })
    );
    expect(
      screen.getByRole('button', { name: 'narrow', hidden: true })
    ).toBeTruthy();
  });
});
