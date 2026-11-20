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
  SetSubscriptionFlowActiveDocument,
  SubscriptionEvent,
  SubscriptionFlowCountsDocument,
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

const { loadHandledCount } = vi.hoisted(() => ({
  loadHandledCount: vi.fn(async () => ({
    data: { subscriptionFlowHandledCount: 12 },
  })),
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
  useLazyQuery: vi.fn(() => [loadHandledCount]),
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
    earliestDay: { days: -360, periodicity: null },
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

// What a plan offers; the flows below only use what their plan offers.
const offering = (
  paymentMethods: string[],
  periodicities: PaymentPeriodicity[]
) => [
  {
    paymentMethods: paymentMethods.map(id => ({ id, name: id })),
    paymentPeriodicities: periodicities,
    forceAutoRenewal: false,
  },
];

const printFlow = flow({
  id: 'flow-print',
  memberPlan: {
    id: 'print',
    name: 'Print',
    availablePaymentMethods: offering(['bill'], [PaymentPeriodicity.Yearly]),
  },
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: [PaymentPeriodicity.Yearly],
  autoRenewal: [true],
  numberOfSubscriptions: 7,
});

const digitalFlow = flow({
  id: 'flow-digital',
  memberPlan: {
    id: 'digital',
    name: 'Digital',
    availablePaymentMethods: offering(['card'], [PaymentPeriodicity.Monthly]),
  },
  paymentMethods: [{ id: 'card', name: 'Karte' }],
  periodicities: [PaymentPeriodicity.Monthly],
  autoRenewal: [true],
});

const mockedUseQuery = useQuery as unknown as Mock;
const refetch = vi.fn();
const navigate = vi.fn();

function mockQueries(
  flows: SubscriptionFlowFragment[],
  counts?: Record<string, number>
) {
  const results = new Map<unknown, unknown>([
    [SubscriptionFlowsDocument, { subscriptionFlows: flows }],
    [
      SubscriptionFlowCountsDocument,
      counts && {
        subscriptionFlows: Object.entries(counts).map(
          ([id, subscriptionCount]) => ({ id, subscriptionCount })
        ),
      },
    ],
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
      [
        'subscriptionFlow.overview.defaultFlow',
        '/communicationflows/flow/default',
      ],
      ['Digital', '/communicationflows/flow/flow-digital'],
      ['Print', '/communicationflows/flow/flow-print'],
    ]);
  });

  it('says for which subscriptions a flow is, how many these are and how many events send something', () => {
    renderOverview();

    const standard = rowOf('subscriptionFlow.overview.defaultFlow');

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

  it('says next to its conditions what a flow no longer does', () => {
    mockQueries([
      defaultFlow,
      printFlow,
      flow({
        id: 'flow-digital',
        memberPlan: digitalFlow.memberPlan,
        paymentMethods: [{ id: 'twint', name: 'Twint' }],
        periodicities: [PaymentPeriodicity.Monthly],
        autoRenewal: [true],
      }),
    ]);
    renderOverview();

    expect(
      within(rowOf('Digital')).getByText(
        'subscriptionFlow.overview.warnings.notOffered(Twint)'
      )
    ).toBeTruthy();
    expect(
      within(rowOf('Print')).queryByText(/subscriptionFlow.overview.warnings/)
    ).toBeNull();
  });

  it('names a flow left behind by a deleted member plan', () => {
    mockQueries([defaultFlow, flow({ id: 'flow-orphan' })]);
    renderOverview();

    const row = rowOf('subscriptionFlow.overview.noMemberPlan');

    expect(
      within(row).getByText('subscriptionFlow.overview.warnings.noMemberPlan')
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
      'subscriptionFlow.overview.defaultFlow',
      'Print',
    ]);
  });

  it('heads the flows by what they are for: standard, then each member plan', () => {
    renderOverview();

    expect(
      screen.getAllByRole('rowheader').map(heading => heading.textContent)
    ).toEqual([
      'subscriptionFlow.overview.group.default',
      'subscriptionFlow.overview.group.memberPlan(Digital)',
      'subscriptionFlow.overview.group.memberPlan(Print)',
    ]);
  });

  it('offers the member plan as the only filter', () => {
    renderOverview('/communicationflows?memberPlan=print');

    expect(
      screen.getAllByLabelText('subscriptionFlow.overview.memberPlan').length
    ).toBeGreaterThan(0);

    for (const label of [
      'subscriptionFlow.paymentMethod',
      'subscriptionFlow.periodicity',
      'subscriptionFlow.autoRenewal',
      'subscriptionFlow.overview.filter.warnings',
      'subscriptionFlow.overview.filter.subscriptions',
    ]) {
      expect(screen.queryByLabelText(label)).toBeNull();
    }
  });

  it('does not narrow by anything but the member plan in the address', () => {
    renderOverview('/communicationflows?term=monthly');

    expect(flowLinks().map(link => link.textContent)).toEqual([
      'subscriptionFlow.overview.defaultFlow',
      'Digital',
      'Print',
    ]);
  });

  it('offers to delete the flows of member plans, never the default flow', () => {
    renderOverview();

    expect(
      within(rowOf('subscriptionFlow.overview.defaultFlow')).queryByRole(
        'button',
        {
          name: 'delete',
        }
      )
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

  // However long the flows get, the account mails stay one click away.
  describe('tabs', () => {
    const tab = (name: RegExp) => screen.getByRole('tab', { name });

    it('opens on the flows, the tab counting them, and leaves the account mails out', () => {
      renderOverview();

      expect(tab(/subscriptionFlow\.overview\.tabs\.flows/).textContent).toBe(
        'subscriptionFlow.overview.tabs.flows(3)'
      );
      expect(
        tab(/subscriptionFlow\.overview\.tabs\.flows/).getAttribute(
          'aria-selected'
        )
      ).toBe('true');
      expect(screen.getAllByRole('table')).toHaveLength(1);
      expect(screen.queryByText('systemMails.events.login_link')).toBeNull();
    });

    it('names the account tab without a count', () => {
      renderOverview();

      expect(tab(/subscriptionFlow\.overview\.tabs\.account/).textContent).toBe(
        'subscriptionFlow.overview.tabs.account'
      );
    });

    it('shows the account mails alone on their tab, as given in the address', () => {
      renderOverview('/communicationflows?tab=account');

      expect(screen.getAllByRole('table')).toHaveLength(1);
      expect(screen.getByText('systemMails.events.login_link')).toBeTruthy();
      expect(
        screen.queryByRole('button', { name: 'subscriptionFlow.newFlow' })
      ).toBeNull();
    });

    // The intro explains flows; it belongs to their tab.
    it('shows the intro on the flows tab only', () => {
      const { unmount } = renderOverview();

      expect(screen.getByText('subscriptionFlow.overview.intro')).toBeTruthy();
      unmount();

      renderOverview('/communicationflows?tab=account');
      expect(screen.queryByText('subscriptionFlow.overview.intro')).toBeNull();
    });

    it('switches between them and keeps the flow filters for the way back', () => {
      renderOverview('/communicationflows?memberPlan=digital');

      fireEvent.click(tab(/subscriptionFlow\.overview\.tabs\.account/));
      expect(screen.getByText('systemMails.events.login_link')).toBeTruthy();

      fireEvent.click(tab(/subscriptionFlow\.overview\.tabs\.flows/));
      expect(flowLinks().map(link => link.textContent)).toEqual([
        'subscriptionFlow.overview.defaultFlow',
        'Digital',
      ]);
    });
  });

  // Each subscription is counted in one flow only, so the counts add up.
  it('sums the subscriptions of the rows shown in the column header', () => {
    renderOverview();

    expect(
      screen.getByRole('columnheader', {
        name: 'subscriptionFlow.overview.subscriptionsSum(47)',
      })
    ).toBeTruthy();
  });

  it('counts each flow narrowed to what the list is filtered by', () => {
    renderOverview('/communicationflows?memberPlan=digital');

    expect(mockedUseQuery).toHaveBeenCalledWith(
      SubscriptionFlowCountsDocument,
      expect.objectContaining({
        variables: { filter: { memberPlanIds: ['digital'] } },
      })
    );
  });

  it('takes the narrowed counts over the unfiltered ones once they are there', () => {
    mockQueries([printFlow, defaultFlow, digitalFlow], {
      'flow-default': 5,
      'flow-print': 2,
      'flow-digital': 0,
    });
    renderOverview();

    expect(within(rowOf('Print')).getByText('2')).toBeTruthy();
    expect(
      screen.getByRole('columnheader', {
        name: 'subscriptionFlow.overview.subscriptionsSum(7)',
      })
    ).toBeTruthy();
  });

  describe('switching a flow on and off', () => {
    const toggleOf = (name: string) =>
      within(rowOf(name)).getByRole('switch', {
        name: 'subscriptionFlow.overview.active',
      });

    const isOn = (name: string) =>
      toggleOf(name).getAttribute('aria-checked') === 'true';

    beforeEach(() =>
      mutationFor(SetSubscriptionFlowActiveDocument).mockReset()
    );

    it('shows the state as a tick: filled while the flow is on, empty while it is off', () => {
      mockQueries([
        defaultFlow,
        printFlow,
        { ...digitalFlow, active: false } as SubscriptionFlowFragment,
      ]);
      renderOverview();

      expect(toggleOf('Print').tagName).toBe('BUTTON');
      expect(
        toggleOf('Print').querySelector('[data-checked="true"]')
      ).toBeTruthy();
      expect(
        toggleOf('Digital').querySelector('[data-checked="false"]')
      ).toBeTruthy();
    });

    it('has a switch for every flow but the default one', () => {
      renderOverview();

      expect(isOn('Print')).toBe(true);
      expect(
        within(rowOf('subscriptionFlow.overview.defaultFlow')).queryByRole(
          'switch'
        )
      ).toBeNull();
    });

    it('says where the subscriptions go before switching a flow off', async () => {
      renderOverview();

      fireEvent.click(toggleOf('Print'));

      const dialog = await screen.findByRole('dialog');

      expect(loadHandledCount).toHaveBeenCalledWith({
        variables: { id: 'flow-print' },
      });
      expect(
        await within(dialog).findByText(
          'subscriptionFlow.overview.deactivateQuestion(12)'
        )
      ).toBeTruthy();

      fireEvent.click(within(dialog).getByRole('button', { name: 'ok' }));

      await waitFor(() =>
        expect(
          mutationFor(SetSubscriptionFlowActiveDocument)
        ).toHaveBeenCalledWith({
          variables: { id: 'flow-print', active: false },
        })
      );
    });

    it('leaves the flow as it is when the question is cancelled', async () => {
      renderOverview();

      fireEvent.click(toggleOf('Print'));
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'cancel',
        })
      );

      expect(
        mutationFor(SetSubscriptionFlowActiveDocument)
      ).not.toHaveBeenCalled();
    });

    it('says what a flow takes over before switching it on, and greys it out while off', async () => {
      mockQueries([
        defaultFlow,
        { ...printFlow, active: false } as SubscriptionFlowFragment,
      ]);
      renderOverview();

      expect(rowOf('Print').className).toContain('inactive-row');
      expect(isOn('Print')).toBe(false);

      fireEvent.click(toggleOf('Print'));

      expect(
        await within(await screen.findByRole('dialog')).findByText(
          'subscriptionFlow.overview.activateQuestion(12)'
        )
      ).toBeTruthy();
    });
  });

  it('keeps the edit action in the same place whether or not a row can be deleted', () => {
    renderOverview();

    const actions = (name: string) =>
      within(rowOf(name))
        .getByRole('button', { name: 'edit' })
        .closest('[data-actions]') as HTMLElement;

    // Rows start their actions at the same edge instead of centring them.
    expect(actions('subscriptionFlow.overview.defaultFlow')).toBeTruthy();
    expect(
      getComputedStyle(actions('subscriptionFlow.overview.defaultFlow'))
        .justifyContent
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
      // A member plan's flow needs every condition.
      expect(
        within(dialog).queryByText('subscriptionFlow.openConditionsHint')
      ).toBeNull();
      expect(
        within(dialog).getByRole('button', { name: 'subscriptionFlow.addNew' })
      ).toBeTruthy();
    });

    it('creates a flow for all member plans when that is chosen instead of a plan', async () => {
      mutationFor(CreateSubscriptionFlowDocument).mockResolvedValue({
        data: { createSubscriptionFlow: [] },
      });
      renderOverview();

      const dialog = await openPanel();

      choosePlan(dialog, 'subscriptionFlow.overview.allMemberPlans');

      // What an empty field means is said where the fields are.
      expect(
        within(dialog).getByText('subscriptionFlow.openConditionsHint')
      ).toBeTruthy();

      const [paymentMethod] = within(dialog)
        .getAllByRole('combobox')
        .filter(field => field.tagName === 'INPUT');

      fireEvent.change(paymentMethod, { target: { value: 'Rech' } });
      fireEvent.click(await screen.findByRole('option', { name: 'Rechnung' }));
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'subscriptionFlow.addNew' })
      );

      await waitFor(() =>
        expect(
          mutationFor(CreateSubscriptionFlowDocument)
        ).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            allMemberPlans: true,
            paymentMethodIds: ['bill'],
          }),
        })
      );
      expect(
        mutationFor(CreateSubscriptionFlowDocument).mock.calls[0][0].variables
          .memberPlanId
      ).toBeUndefined();
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
