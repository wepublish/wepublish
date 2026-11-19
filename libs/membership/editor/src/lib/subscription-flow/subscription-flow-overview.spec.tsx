import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CreateSubscriptionFlowDocument,
  DeleteSubscriptionFlowDocument,
  ListPaymentMethodsDocument,
  MailTemplateDocument,
  MemberPlanListDocument,
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowFragment,
  SubscriptionFlowsDocument,
  SystemMailsDocument,
} from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { SubscriptionFlowOverview } from './subscription-flow-overview';

const letterFlow = vi.fn(() => false);

vi.mock('../delivery-mode/use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => letterFlow(),
}));

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, ReturnType<typeof vi.fn>>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as ReturnType<typeof vi.fn>;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn((document: unknown) => [
    mutationFor(document),
    { loading: false },
  ]),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key,
    i18n: { language: 'en' },
  }),
}));

const interval = (
  id: string,
  event: SubscriptionEvent,
  template: string | null,
  sendAsLetter = false
) => ({
  __typename: 'SubscriptionInterval' as const,
  id,
  event,
  daysAwayFromEnding: null,
  sendAsLetter,
  mailTemplate: template ? { id: template, name: template } : null,
});

const flow = (overrides: Record<string, unknown>) =>
  ({
    __typename: 'SubscriptionFlowModel',
    default: false,
    memberPlan: null,
    autoRenewal: [],
    paymentMethods: [],
    periodicities: [],
    intervals: [],
    numberOfSubscriptions: 0,
    ...overrides,
  }) as unknown as SubscriptionFlowFragment;

const defaultFlow = flow({
  id: 'flow-default',
  default: true,
  numberOfSubscriptions: 40,
  intervals: [
    interval('i-1', SubscriptionEvent.Subscribe, 'welcome'),
    interval('i-2', SubscriptionEvent.InvoiceCreation, 'invoice', true),
    interval('i-3', SubscriptionEvent.DeactivationUnpaid, null),
  ],
});

const printFlow = flow({
  id: 'flow-print',
  memberPlan: { id: 'print', name: 'Print' },
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: [PaymentPeriodicity.Yearly],
  autoRenewal: [true],
  numberOfSubscriptions: 7,
});

const digitalFlow = flow({
  id: 'flow-digital',
  memberPlan: { id: 'digital', name: 'Digital' },
  paymentMethods: [{ id: 'card', name: 'Karte' }],
  periodicities: [PaymentPeriodicity.Monthly],
  autoRenewal: [true],
});

const mockedUseQuery = useQuery as unknown as Mock;
const refetch = vi.fn();
const navigate = vi.fn();

function mockQueries(flows: SubscriptionFlowFragment[]) {
  const results = new Map<unknown, unknown>([
    [SubscriptionFlowsDocument, { subscriptionFlows: flows }],
    [MailTemplateDocument, { mailTemplates: [] }],
    [
      ListPaymentMethodsDocument,
      { paymentMethods: [{ id: 'bill', name: 'Rechnung' }] },
    ],
    [
      MemberPlanListDocument,
      {
        memberPlans: {
          nodes: [
            { id: 'print', name: 'Print' },
            { id: 'digital', name: 'Digital' },
          ],
        },
      },
    ],
    [
      SystemMailsDocument,
      {
        systemMails: [
          {
            __typename: 'SystemMailModel',
            event: 'LOGIN_LINK',
            mailTemplate: null,
          },
        ],
      },
    ],
  ]);

  mockedUseQuery.mockImplementation((document: unknown) => ({
    data: results.get(document),
    loading: false,
    refetch,
  }));
}

const renderOverview = (url = '/communicationflows') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <SubscriptionFlowOverview />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const flowLinks = () =>
  screen
    .getAllByRole('link')
    .filter(link =>
      link.getAttribute('href')?.startsWith('/communicationflows/flow/')
    );

const rowOf = (name: string) =>
  screen.getByRole('link', { name }).closest('tr') as HTMLElement;

describe('SubscriptionFlowOverview', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedUseQuery.mockReset();
    refetch.mockReset();
    navigate.mockReset();
    (useNavigate as unknown as Mock).mockReturnValue(navigate);
    mutationFor(DeleteSubscriptionFlowDocument).mockReset();
    mutationFor(CreateSubscriptionFlowDocument).mockReset();
    letterFlow.mockReturnValue(false);
    mockQueries([printFlow, defaultFlow, digitalFlow]);
  });

  it('titles the page and asks for every flow with its count', () => {
    renderOverview();

    expect(
      screen.getAllByRole('heading', { level: 1 }).map(h => h.textContent)
    ).toEqual(['automaticMails.title']);
    expect(mockedUseQuery).toHaveBeenCalledWith(
      SubscriptionFlowsDocument,
      expect.objectContaining({ variables: { defaultFlowOnly: false } })
    );
  });

  it('lists the default flow first, then the flows by member plan, each linking to its page', () => {
    renderOverview();

    expect(
      flowLinks().map(link => [link.textContent, link.getAttribute('href')])
    ).toEqual([
      ['subscriptionFlow.defaultFlow', '/communicationflows/flow/default'],
      ['Digital', '/communicationflows/flow/flow-digital'],
      ['Print', '/communicationflows/flow/flow-print'],
    ]);
  });

  it('says for which subscriptions a flow is, how many these are and how many events send something', () => {
    renderOverview();

    const standard = rowOf('subscriptionFlow.defaultFlow');

    expect(
      within(standard).getByText('subscriptionFlow.overview.defaultApplies')
    ).toBeTruthy();
    expect(within(standard).getByText('40')).toBeTruthy();
    expect(
      within(standard).getByText('subscriptionFlow.overview.eventsValue(2,7)')
    ).toBeTruthy();

    const print = rowOf('Print');

    expect(
      within(print).getByText(
        'Rechnung · memberPlanList.paymentPeriodicity.yearly · subscriptionFlow.overview.renewal.true'
      )
    ).toBeTruthy();
    expect(within(print).getByText('7')).toBeTruthy();
    expect(
      within(print).getByText('subscriptionFlow.overview.eventsValue(0,5)')
    ).toBeTruthy();
  });

  it('shows how many events are printed only where the letter flow is on', () => {
    renderOverview();

    expect(
      screen.queryByRole('columnheader', {
        name: /subscriptionFlow.overview.letterEvents/,
      })
    ).toBeNull();
  });

  it('shows how many events are also printed with the letter flow', () => {
    letterFlow.mockReturnValue(true);
    renderOverview();

    expect(
      screen.getByRole('columnheader', {
        name: /subscriptionFlow.overview.letterEvents/,
      })
    ).toBeTruthy();
  });

  it('narrows to the member plan in the address and keeps the default flow', () => {
    renderOverview('/communicationflows?memberPlan=print');

    expect(flowLinks().map(link => link.textContent)).toEqual([
      'subscriptionFlow.defaultFlow',
      'Print',
    ]);
  });

  it('offers to delete the flows of member plans, never the default flow', () => {
    renderOverview();

    expect(
      within(rowOf('subscriptionFlow.defaultFlow')).queryByRole('button', {
        name: 'delete',
      })
    ).toBeNull();
    expect(
      within(rowOf('Print')).getByRole('button', { name: 'delete' })
    ).toBeTruthy();
  });

  it('deletes a flow after asking, and loads the list again', async () => {
    mutationFor(DeleteSubscriptionFlowDocument).mockResolvedValue({});
    renderOverview();

    fireEvent.click(
      within(rowOf('Print')).getByRole('button', { name: 'delete' })
    );

    const dialog = await screen.findByRole('dialog');

    expect(mutationFor(DeleteSubscriptionFlowDocument)).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'subscriptionFlow.deletePermanently',
      })
    );

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(mutationFor(DeleteSubscriptionFlowDocument)).toHaveBeenCalledWith({
      variables: { id: 'flow-print' },
    });
  });

  it('shows the account mails below the flows, as a second table under a heading of the same kind', () => {
    renderOverview();

    const [flows, account] = screen.getAllByRole('table');

    expect(
      within(account).getByText('systemMails.events.login_link')
    ).toBeTruthy();
    expect(
      flows.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
    ).toEqual(['subscriptionFlow.overview.title', 'systemMails.title']);
  });

  it('keeps the edit action in the same place whether or not a row can be deleted', () => {
    renderOverview();

    const actions = (name: string) =>
      within(rowOf(name))
        .getByRole('button', { name: 'edit' })
        .closest('[data-actions]') as HTMLElement;

    // Rows start their actions at the same edge instead of centring them.
    expect(actions('subscriptionFlow.defaultFlow')).toBeTruthy();
    expect(
      getComputedStyle(actions('subscriptionFlow.defaultFlow')).justifyContent
    ).toBe('flex-start');
    expect(getComputedStyle(actions('Print')).justifyContent).toBe(
      'flex-start'
    );
  });

  describe('creating a flow', () => {
    const openPanel = async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'subscriptionFlow.newFlow' })
      );

      return screen.findByRole('dialog');
    };

    const choosePlan = (dialog: HTMLElement, name: string) => {
      fireEvent.mouseDown(
        within(dialog).getByRole('combobox', {
          name: 'subscriptionFlow.overview.memberPlan',
        })
      );
      fireEvent.click(screen.getByRole('option', { name }));
    };

    it('asks for the member plan first, then for the conditions', async () => {
      renderOverview();

      const dialog = await openPanel();

      expect(
        within(dialog).queryByText('subscriptionFlow.paymentMethod')
      ).toBeNull();

      choosePlan(dialog, 'Digital');

      expect(
        within(dialog).getByText('subscriptionFlow.paymentMethod')
      ).toBeTruthy();
      expect(
        within(dialog).getByRole('button', { name: 'subscriptionFlow.addNew' })
      ).toBeTruthy();
    });

    it('starts with the member plan the list is narrowed to', async () => {
      renderOverview('/communicationflows?memberPlan=print');

      const dialog = await openPanel();

      expect(
        within(dialog).getByText('subscriptionFlow.paymentMethod')
      ).toBeTruthy();
    });

    it('creates the flow for that plan and opens its page', async () => {
      mutationFor(CreateSubscriptionFlowDocument).mockResolvedValue({
        data: {
          createSubscriptionFlow: [
            defaultFlow,
            printFlow,
            digitalFlow,
            flow({
              id: 'flow-new',
              memberPlan: { id: 'print', name: 'Print' },
            }),
          ],
        },
      });
      renderOverview('/communicationflows?memberPlan=print');

      const dialog = await openPanel();
      // The first field is the member plan; the conditions follow.
      const [paymentMethod] = within(dialog)
        .getAllByRole('combobox')
        .filter(field => field.tagName === 'INPUT');

      fireEvent.change(paymentMethod, { target: { value: 'Rech' } });
      fireEvent.click(await screen.findByRole('option', { name: 'Rechnung' }));
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'subscriptionFlow.addNew' })
      );

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith(
          '/communicationflows/flow/flow-new'
        )
      );
      expect(mutationFor(CreateSubscriptionFlowDocument)).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          memberPlanId: 'print',
          paymentMethodIds: ['bill'],
        }),
      });
    });
  });
});
