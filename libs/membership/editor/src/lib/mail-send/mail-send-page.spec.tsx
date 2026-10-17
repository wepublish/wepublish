import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MailSendPage } from './mail-send-page';

/**
 * Pins how the page behaves before the audience filter is pulled out into
 * components of its own: the same clicks must produce the same queries after.
 */
const queries = vi.fn();
const mutate = vi.fn(async () => ({ data: {} }));

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: (document: unknown) => [
    (options?: unknown) => mutate(operationName(document), options),
    { loading: false },
  ],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  useAuthorisation: () => true,
  // The real one is a MUI date picker pair; a button that picks a fixed range
  // is enough to see what the page makes of a chosen range.
  DateRangeFilter: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (range: { from: Date | null; to: Date | null }) => void;
  }) => (
    <button
      onClick={() =>
        onChange({
          from: new Date('2026-01-01T10:00:00.000Z'),
          to: new Date('2026-01-31T10:00:00.000Z'),
        })
      }
    >
      {label}
    </button>
  ),
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({ paperLetters: true, letterAvailable: true }),
}));

vi.mock('../delivery-mode/delivery-mode-audience-action', () => ({
  DeliveryModeAudienceAction: () => <button>deliveryMode.audience.open</button>,
}));

vi.mock('./email-quality-refresh-button', () => ({
  EmailQualityRefreshButton: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const preview = {
  count: 12,
  userCount: 10,
  withoutAddressCount: 2,
  allowsSubscriptionTemplates: false,
  segments: [
    { segment: 'placeholder', userCount: 3 },
    { segment: 'active', userCount: 7 },
  ],
};

const answer = (name: string) => {
  switch (name) {
    case 'MailTemplate':
      return {
        data: {
          mailTemplates: [
            { id: 'tpl-1', name: 'Rechnung', context: 'custom' },
            { id: 'tpl-2', name: 'Erinnerung', context: 'custom' },
          ],
        },
        refetch: vi.fn(async () => undefined),
      };
    case 'MemberPlanList':
      return {
        data: { memberPlans: { nodes: [{ id: 'plan-1', name: 'Jahresabo' }] } },
      };
    case 'PaymentMethodList':
      return { data: { paymentMethods: [{ id: 'pm-1', name: 'Rechnung' }] } };
    case 'MailSendRecipientPreview':
      return {
        data: { mailSendRecipientPreview: preview },
        loading: false,
        refetch: vi.fn(async () => undefined),
      };
    case 'MailTemplateMissingPlaceholders':
      return {
        data: { mailTemplateMissingPlaceholders: [] },
        refetch: vi.fn(async () => undefined),
      };
    case 'MailSendRecipients':
      return {
        data: { mailSendRecipients: { nodes: [], totalCount: 0 } },
        loading: false,
      };
    default:
      return { data: undefined, loading: false, refetch: vi.fn() };
  }
};

const lastPreviewAudience = () =>
  queries.mock.calls
    .filter(([name]) => name === 'MailSendRecipientPreview')
    .at(-1)?.[1].variables;

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <MailSendPage />
      </MemoryRouter>
    </ThemeProvider>
  );

const pickTemplate = () => {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
  fireEvent.click(screen.getByRole('option', { name: 'Rechnung' }));
};

const goToAudience = () => {
  pickTemplate();
  fireEvent.click(screen.getByRole('button', { name: /mailSend\.next/ }));
};

// The radio's name is its label followed by its hint.
const pickBase = (base: string) =>
  fireEvent.click(
    screen.getByRole('radio', {
      name: new RegExp(`^mailSend\\.base\\.${base} `),
    })
  );

describe('MailSendPage (characterisation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.mockImplementation((name: string) => answer(name));
  });

  afterEach(cleanup);

  it('previews everyone by mail until the author narrows it down', () => {
    renderPage();

    expect(lastPreviewAudience()).toEqual({
      audience: { base: 'allUsers', emailSegments: undefined },
      channel: 'mail',
    });
  });

  it('shows the subscription filters for the subscribers base and feeds them into the audience', () => {
    renderPage();
    goToAudience();

    expect(screen.queryByText('mailSend.autoRenew')).toBeNull();

    pickBase('hasSubscription');

    expect(screen.getByText('mailSend.autoRenew')).toBeTruthy();
    expect(lastPreviewAudience().audience).toEqual({
      base: 'hasSubscription',
      emailSegments: undefined,
      memberPlanIDs: undefined,
      subscriptionState: undefined,
      autoRenew: undefined,
      paymentMethodID: undefined,
      paymentPeriodicity: undefined,
      startsAtFrom: undefined,
      startsAtTo: undefined,
      endsAtFrom: undefined,
      endsAtTo: undefined,
      isPaid: undefined,
      isCanceled: undefined,
      hasReplacedSubscription: undefined,
    });

    fireEvent.click(screen.getByRole('button', { name: 'mailSend.startsAt' }));

    const endOfDay = new Date('2026-01-31T10:00:00.000Z');
    endOfDay.setHours(23, 59, 59, 999);

    expect(lastPreviewAudience().audience).toEqual(
      expect.objectContaining({
        startsAtFrom: '2026-01-01T10:00:00.000Z',
        startsAtTo: endOfDay.toISOString(),
      })
    );
  });

  it('looks 90 days back for the win-back base by default', () => {
    renderPage();
    goToAudience();
    pickBase('endedSubscription');

    expect(lastPreviewAudience().audience).toEqual({
      base: 'endedSubscription',
      emailSegments: undefined,
      endedWithinDays: 90,
      endedFrom: undefined,
      endedTo: undefined,
      memberPlanIDs: undefined,
    });
  });

  it('toggles an email segment from its tile', () => {
    renderPage();
    goToAudience();

    const tile = screen.getByRole('button', {
      name: 'mailSend.emailSegments.placeholder: 3',
    });

    fireEvent.click(tile);
    expect(lastPreviewAudience().audience.emailSegments).toEqual([
      'placeholder',
    ]);

    fireEvent.click(tile);
    expect(lastPreviewAudience().audience.emailSegments).toBeUndefined();
  });

  it('lists the recipients fifty at a time once asked', () => {
    renderPage();
    goToAudience();

    const recipientsQuery = () =>
      queries.mock.calls
        .filter(([name]) => name === 'MailSendRecipients')
        .at(-1)?.[1];

    expect(recipientsQuery().skip).toBe(true);

    fireEvent.click(
      screen.getByRole('button', { name: 'mailSend.showRecipients' })
    );

    expect(recipientsQuery()).toEqual(
      expect.objectContaining({
        skip: false,
        variables: expect.objectContaining({ skip: 0, take: 50 }),
      })
    );
  });

  it('offers the delivery switch next to the send button on the last step', () => {
    renderPage();
    goToAudience();
    fireEvent.click(screen.getByRole('button', { name: /mailSend\.next/ }));

    expect(
      screen.getByRole('button', { name: 'deliveryMode.audience.open' })
    ).toBeTruthy();
    const send = screen.getByRole('button', { name: /mailSend\.send$/ });
    expect(send.hasAttribute('disabled')).toBe(false);

    fireEvent.click(send);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'mailSend.confirm' })
    );

    expect(mutate).toHaveBeenCalledWith('CreateMailSendJob', {
      variables: {
        input: {
          mailTemplateId: 'tpl-1',
          audience: { base: 'allUsers', emailSegments: undefined },
          channel: 'mail',
          print: undefined,
        },
      },
    });
  });
});
