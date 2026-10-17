import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliveryModeAudienceSection } from './delivery-mode-audience-section';

const queries = vi.fn();
const authorised = vi.fn(() => true);
const flow = vi.fn(() => true);
const actionProps = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: (permission: string) => authorised(permission),
}));

vi.mock('./use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => flow(),
}));

// The filter and the action are covered on their own; here only their wiring.
vi.mock('../mail-send/audience/audience-filter', () => ({
  AudienceFilter: () => <div>audience-filter</div>,
}));

vi.mock('./delivery-mode-audience-action', () => ({
  DeliveryModeAudienceAction: (props: any) => {
    actionProps(props);

    return (
      <button
        onClick={() =>
          props.onDone({ changed: 1, skippedWithoutAddress: 0 }, 'letter')
        }
      >
        action
      </button>
    );
  },
}));

vi.mock('./delivery-mode-bulk-changes', () => ({
  DeliveryModeBulkChanges: ({ refreshKey }: { refreshKey: number }) => (
    <div>bulk-changes:{refreshKey}</div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const preview = {
  userCount: 12,
  withoutAddressCount: 3,
  segments: [{ segment: 'placeholder', userCount: 4 }],
};

const renderSection = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <DeliveryModeAudienceSection />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('DeliveryModeAudienceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorised.mockReturnValue(true);
    flow.mockReturnValue(true);
    queries.mockImplementation((name: string) =>
      name === 'DeliveryModeAudiencePreview' ?
        {
          data: { deliveryModeAudiencePreview: preview },
          loading: false,
          refetch: vi.fn(),
        }
      : { data: undefined, loading: false }
    );
  });

  afterEach(cleanup);

  it('stays away without the letter flow or the permission', () => {
    flow.mockReturnValue(false);
    renderSection();
    expect(screen.queryByText('deliveryMode.bulk.title')).toBeNull();

    cleanup();
    flow.mockReturnValue(true);
    authorised.mockImplementation(
      (permission: string) => permission !== 'CAN_MANAGE_USER-DELIVERY-MODE'
    );
    renderSection();
    expect(screen.queryByText('deliveryMode.bulk.title')).toBeNull();
  });

  it('previews the audience per person and hands it to the switch', () => {
    renderSection();

    expect(
      queries.mock.calls.find(
        ([name]) => name === 'DeliveryModeAudiencePreview'
      )?.[1]
    ).toEqual(
      expect.objectContaining({
        variables: {
          audience: {
            base: 'allUsers',
            emailSegments: undefined,
            mailHistory: undefined,
          },
          channel: 'letter',
        },
      })
    );
    expect(
      screen.getByText('deliveryMode.bulk.people:{"count":12}')
    ).toBeTruthy();
    expect(
      screen.getByText('mailSend.channel.withoutAddress:{"count":3}')
    ).toBeTruthy();
    expect(actionProps).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: expect.objectContaining({ base: 'allUsers' }),
      })
    );
  });

  it('refreshes the recent switches once a switch went through', () => {
    renderSection();

    expect(screen.getByText('bulk-changes:0')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'action' }));
    expect(screen.getByText('bulk-changes:1')).toBeTruthy();
  });

  it('offers the recipient list only to those allowed to see it', () => {
    renderSection();
    expect(
      screen.getByRole('button', { name: 'mailSend.showRecipients' })
    ).toBeTruthy();

    cleanup();
    authorised.mockImplementation(
      (permission: string) => permission !== 'CAN_SEND_MAIL-TEMPLATES'
    );
    renderSection();
    expect(
      screen.queryByRole('button', { name: 'mailSend.showRecipients' })
    ).toBeNull();
  });
});
