import type { Mock } from 'vitest';
import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  DeleteSubscriptionFlowDocument,
  DeleteSubscriptionIntervalDocument,
  ListPaymentMethodsDocument,
  MailTemplateDocument,
  SubscriptionEvent,
  SubscriptionFlowFragment,
  SubscriptionFlowsDocument,
  SystemMailsDocument,
} from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';

import { SubscriptionFlowPage } from './subscription-flow-list';

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
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key,
    i18n: { language: 'en' },
  }),
}));

const page = () => (
  <MemoryRouter>
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SubscriptionFlowPage />
    </ThemeProvider>
  </MemoryRouter>
);

const renderPage = () => render(page());

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseParams = useParams as unknown as Mock;
const mockedUseNavigate = useNavigate as unknown as Mock;
const navigate = vi.fn();

const interval = (
  id: string,
  event: SubscriptionEvent,
  daysAwayFromEnding: number | null
) => ({
  __typename: 'SubscriptionInterval' as const,
  id,
  event,
  daysAwayFromEnding,
  mailTemplate: null,
});

const flow = (
  id: string,
  isDefault: boolean,
  intervals: ReturnType<typeof interval>[]
) =>
  ({
    __typename: 'SubscriptionFlowModel',
    id,
    default: isDefault,
    memberPlan: null,
    autoRenewal: [],
    paymentMethods: [],
    periodicities: [],
    intervals,
    numberOfSubscriptions: 3,
    earliestDay: { days: -25, periodicity: null },
  }) as unknown as SubscriptionFlowFragment;

const defaultFlow = flow('flow-default', true, [
  interval('i-1', SubscriptionEvent.InvoiceCreation, 0),
  interval('i-2', SubscriptionEvent.DeactivationUnpaid, 25),
]);

const customFlow = {
  ...flow('flow-a', false, [
    interval('i-3', SubscriptionEvent.Custom, -25),
    interval('i-4', SubscriptionEvent.InvoiceCreation, 0),
    interval('i-5', SubscriptionEvent.DeactivationUnpaid, 5),
  ]),
  memberPlan: {
    id: 'plan',
    name: 'Probe-Abo',
    availablePaymentMethods: [
      {
        paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
        paymentPeriodicities: ['yearly'],
        forceAutoRenewal: false,
      },
    ],
  },
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: ['yearly'],
  autoRenewal: [true],
} as unknown as SubscriptionFlowFragment;

function mockQueries(flows: SubscriptionFlowFragment[]) {
  const results = new Map<unknown, unknown>([
    [SubscriptionFlowsDocument, { subscriptionFlows: flows }],
    [MailTemplateDocument, { mailTemplates: [] }],
    [ListPaymentMethodsDocument, { paymentMethods: [] }],
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
    refetch: vi.fn(),
  }));
}

const dayLabel = (day: number) => `subscriptionFlow.dayWithNumber(${day})`;

describe('SubscriptionFlowPage', () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockedUseParams.mockReset();
    navigate.mockReset();
    mockedUseNavigate.mockReturnValue(navigate);
    (useMutation as unknown as Mock).mockClear();
  });

  describe('with the paper letter flow', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'default' });
      mockQueries([defaultFlow]);
    });

    afterEach(() => letterFlow.mockReturnValue(false));

    it('says what printing an event means and where the channels are managed', () => {
      letterFlow.mockReturnValue(true);
      renderPage();

      expect(screen.getByText('deliveryChannel.flows.letterHint')).toBeTruthy();
      expect(
        screen
          .getByRole('link', { name: 'deliveryChannel.flows.manage' })
          .getAttribute('href')
      ).toBe('/deliverychannel');
    });

    it('says nothing of letters where none can be sent', () => {
      renderPage();

      expect(screen.queryByText('deliveryChannel.flows.letterHint')).toBeNull();
    });
  });

  describe('for the default flow', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'default' });
      mockQueries([defaultFlow]);
    });

    it('groups the subscription events and the timeline in one block', () => {
      const { container } = renderPage();

      const block = screen.getByRole('region', {
        name: 'subscriptionFlow.subscriptionEvents',
      });

      expect(
        within(block).getByText('subscriptionFlow.subscribe')
      ).toBeTruthy();
      expect(
        within(block).getByText('subscriptionFlow.deactivation_by_user')
      ).toBeTruthy();
      expect(within(block).getByText(dayLabel(25))).toBeTruthy();
      expect(container.querySelector('table')).toBeNull();
    });

    it('leaves the account mails to the overview', () => {
      renderPage();

      expect(
        screen.queryByRole('region', { name: 'systemMails.title' })
      ).toBeNull();
    });

    it('links back to the overview of all flows', () => {
      renderPage();

      expect(
        screen
          .getByRole('link', { name: 'subscriptionFlow.overview.back' })
          .getAttribute('href')
      ).toBe('/communicationflows');
    });

    it('counts the subscriptions of every member plan the default flow is left with', () => {
      renderPage();

      expect(mockedUseQuery).toHaveBeenCalledWith(
        SubscriptionFlowsDocument,
        expect.objectContaining({
          variables: { defaultFlowOnly: true },
        })
      );
      expect(
        screen.getByText('subscriptionFlow.subscriptionsAffected(3)')
      ).toBeTruthy();
    });

    it('says next to the invoice day that the default flow never acts earlier than 25 days', () => {
      renderPage();

      expect(
        screen.getByRole('button', {
          name: 'subscriptionFlow.earliestDay.defaultFlow(25)',
        })
      ).toBeTruthy();
    });

    it('lists the timeline days from the earliest to the latest', () => {
      renderPage();

      const days = screen
        .getAllByText(/subscriptionFlow\.dayWithNumber/)
        .map(element => element.textContent);

      expect(days).toEqual([dayLabel(0), dayLabel(25)]);
    });

    it('removes a day that was added but has no mail yet', async () => {
      renderPage();

      fireEvent.click(
        screen.getByText('subscriptionFlow.addDay', { selector: 'button' })
      );
      fireEvent.click(
        await screen.findByText('subscriptionFlow.add', { selector: 'button' })
      );

      expect(screen.getByText(dayLabel(-3))).toBeTruthy();

      fireEvent.click(screen.getByLabelText('subscriptionFlow.deleteMail'));

      expect(screen.queryByText(dayLabel(-3))).toBeNull();
    });

    it('adds another mail below the mails of a day', () => {
      const { rerender } = renderPage();

      const dayRow = () =>
        screen.getByText(dayLabel(25)).closest('li') as HTMLElement;
      const emptySelects = () =>
        within(dayRow()).queryAllByText(
          'mailTemplateSelect.noMailSentSelectNow'
        );

      expect(emptySelects()).toHaveLength(1);

      fireEvent.click(
        within(dayRow()).getByRole('button', {
          name: 'subscriptionFlow.addMail',
        })
      );

      expect(emptySelects()).toHaveLength(2);

      mockQueries([
        flow('flow-default', true, [
          ...defaultFlow.intervals,
          interval('i-new', SubscriptionEvent.Custom, 25),
        ]),
      ]);
      rerender(page());

      expect(emptySelects()).toHaveLength(2);
      expect(
        within(dayRow()).getAllByLabelText('subscriptionFlow.deleteMail')
      ).toHaveLength(1);
    });

    it('cancels an added mail that has no template yet', () => {
      renderPage();

      const dayRow = () =>
        screen.getByText(dayLabel(25)).closest('li') as HTMLElement;

      fireEvent.click(
        within(dayRow()).getByRole('button', {
          name: 'subscriptionFlow.addMail',
        })
      );
      fireEvent.click(
        within(dayRow()).getByLabelText('subscriptionFlow.deleteMail')
      );

      expect(
        within(dayRow()).queryAllByText(
          'mailTemplateSelect.noMailSentSelectNow'
        )
      ).toHaveLength(1);
    });

    it('removes an added day together with its mail in one click', async () => {
      const { rerender } = renderPage();

      fireEvent.click(
        screen.getByText('subscriptionFlow.addDay', { selector: 'button' })
      );
      fireEvent.click(
        await screen.findByText('subscriptionFlow.add', { selector: 'button' })
      );

      mockQueries([
        flow('flow-default', true, [
          ...defaultFlow.intervals,
          interval('i-new', SubscriptionEvent.Custom, -3),
        ]),
      ]);
      rerender(page());

      fireEvent.click(screen.getByLabelText('subscriptionFlow.deleteMail'));

      expect(
        mutationFor(DeleteSubscriptionIntervalDocument)
      ).toHaveBeenCalledWith({ variables: { id: 'i-new' } });

      mockQueries([defaultFlow]);
      rerender(page());

      expect(screen.queryByText(dayLabel(-3))).toBeNull();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'default' });
      mockQueries([defaultFlow]);
    });

    const renderAuthorised = () =>
      render(
        <AuthContext.Provider value={sessionWithPermissions}>
          {page()}
        </AuthContext.Provider>
      );

    it('titles the page as the only level-one heading', () => {
      renderAuthorised();

      expect(
        screen.getAllByRole('heading', { level: 1 }).map(h => h.textContent)
      ).toEqual(['subscriptionFlow.defaultFlow']);
    });

    it('nests the headings without skipping a level', () => {
      renderAuthorised();

      const levels = screen
        .getAllByRole('heading')
        .map(heading => Number(heading.tagName.slice(1)));

      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level - levels[index - 1]).toBeLessThanOrEqual(1);
        }
      });
    });

    it('keeps the help buttons out of the headings', () => {
      renderAuthorised();

      expect(
        screen.getByRole('heading', { name: 'subscriptionFlow.timeline' })
      ).toBeTruthy();
      expect(
        screen
          .getByRole('button', { name: 'subscriptionFlow.timelineDescription' })
          .closest('h1, h2, h3, h4, h5, h6')
      ).toBeNull();
    });

    it('labels the day input and the confirm button of «change day»', async () => {
      renderAuthorised();

      fireEvent.click(
        screen.getByRole('button', { name: 'subscriptionFlow.editDay' })
      );

      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('spinbutton', {
          name: 'subscriptionFlow.editDay',
        })
      ).toBeTruthy();
      expect(within(dialog).getByRole('button', { name: 'save' })).toBeTruthy();
    });

    it('labels the day input of «add day»', async () => {
      renderAuthorised();

      fireEvent.click(
        screen.getByText('subscriptionFlow.addDay', { selector: 'button' })
      );

      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('spinbutton', {
          name: 'subscriptionFlow.newDayTitle',
        })
      ).toBeTruthy();
    });

    it('names every mail template select after its event or day', () => {
      renderAuthorised();

      for (const name of [
        'subscriptionFlow.subscribe',
        'subscriptionFlow.deactivation_unpaid',
      ]) {
        expect(
          screen.getByRole('button', { name: new RegExp(`^${name}: `) })
        ).toBeTruthy();
      }
    });

    it('names the drag handle of a mail after the mail', () => {
      renderAuthorised();

      expect(
        screen.getByRole('button', {
          name: 'subscriptionFlow.moveMail(subscriptionFlow.deactivation_unpaid)',
        })
      ).toBeTruthy();
    });
  });

  describe('for the flow of a member plan', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'flow-a' });
      mockQueries([defaultFlow, customFlow]);
    });

    const renderAuthorised = () =>
      render(
        <AuthContext.Provider value={sessionWithPermissions}>
          {page()}
        </AuthContext.Provider>
      );

    it('titles the page after the member plan and says which subscriptions it is for', () => {
      renderPage();

      expect(
        screen.getAllByRole('heading', { level: 1 }).map(h => h.textContent)
      ).toEqual(['«Probe-Abo»']);
      expect(
        screen.getByText(
          'Rechnung · memberPlanList.paymentPeriodicity.yearly · subscriptionFlow.overview.renewal.true'
        )
      ).toBeTruthy();
      expect(
        screen.getByText(
          'subscriptionFlow.planFlowDescriptionFor(Probe-Abo) subscriptionFlow.noFallback'
        )
      ).toBeTruthy();
    });

    it('titles the page with the plan name alone, without an icon', () => {
      renderPage();

      expect(
        screen.getByRole('heading', { level: 1 }).querySelector('svg')
      ).toBeNull();
    });

    it('has no warning for a flow its plan fully offers', () => {
      renderPage();

      expect(screen.queryByRole('alert')).toBeNull();
    });

    describe('for all member plans', () => {
      beforeEach(() =>
        mockQueries([
          defaultFlow,
          {
            ...customFlow,
            memberPlan: null,
            allMemberPlans: true,
          } as SubscriptionFlowFragment,
        ])
      );

      it('is titled so and says whose subscriptions it takes', () => {
        renderPage();

        expect(
          screen.getAllByRole('heading', { level: 1 }).map(h => h.textContent)
        ).toEqual(['subscriptionFlow.overview.allMemberPlans']);
        expect(
          screen.getByText(
            'subscriptionFlow.allPlansFlowDescription subscriptionFlow.noFallback'
          )
        ).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
      });

      it('lets its conditions be changed', () => {
        renderPage();

        expect(screen.getByText('subscriptionFlow.paymentMethod')).toBeTruthy();
        expect(screen.getByText('subscriptionFlow.periodicity')).toBeTruthy();
      });
    });

    it('warns about a flow left behind by a deleted member plan', () => {
      mockQueries([
        defaultFlow,
        { ...customFlow, memberPlan: null } as SubscriptionFlowFragment,
      ]);
      renderPage();

      expect(
        screen.getAllByRole('heading', { level: 1 }).map(h => h.textContent)
      ).toEqual(['subscriptionFlow.overview.noMemberPlan']);
      expect(screen.getByRole('alert').textContent).toContain(
        'subscriptionFlow.overview.warnings.noMemberPlan'
      );
    });

    describe('the earliest day of its events', () => {
      const yearlyHint =
        'subscriptionFlow.earliestDay.byConditions(360,memberPlanList.paymentPeriodicity.yearly)';

      const withEarliestDay = (
        earliestDay: Record<string, unknown>,
        intervals = customFlow.intervals
      ) =>
        mockQueries([
          defaultFlow,
          { ...customFlow, earliestDay, intervals } as SubscriptionFlowFragment,
        ]);

      beforeEach(() => withEarliestDay({ days: -360, periodicity: 'yearly' }));

      it('is explained next to the day of the invoice creation', () => {
        renderPage();

        const invoiceDay = screen
          .getByText(dayLabel(0))
          .closest('li') as HTMLElement;
        const customMailDay = screen
          .getByText(dayLabel(-25))
          .closest('li') as HTMLElement;

        expect(
          within(invoiceDay).getByRole('button', { name: yearlyHint })
        ).toBeTruthy();
        expect(
          within(customMailDay).queryByRole('button', { name: yearlyHint })
        ).toBeNull();
      });

      it('bounds the day input of «change day» and says why', async () => {
        renderAuthorised();

        fireEvent.click(
          screen.getAllByRole('button', {
            name: 'subscriptionFlow.editDay',
          })[0]
        );

        const dialog = await screen.findByRole('dialog');
        const input = within(dialog).getByRole('spinbutton', {
          name: 'subscriptionFlow.editDay',
        });

        expect(input.getAttribute('min')).toBe('-360');
        expect(input.getAttribute('max')).toBe('90');
        expect(within(dialog).getByText(yearlyHint)).toBeTruthy();
      });

      it('bounds the day input of «add day»', async () => {
        renderAuthorised();

        fireEvent.click(
          screen.getByText('subscriptionFlow.addDay', { selector: 'button' })
        );

        const input = within(await screen.findByRole('dialog')).getByRole(
          'spinbutton',
          { name: 'subscriptionFlow.newDayTitle' }
        );

        expect(input.getAttribute('min')).toBe('-360');
        expect(input.getAttribute('max')).toBe('90');
      });
    });

    it('shows this flow only, not the default flow next to it', () => {
      renderPage();

      expect(screen.getAllByRole('region')).toHaveLength(1);
      expect(screen.getByText(dayLabel(-25))).toBeTruthy();
      expect(screen.queryByText(dayLabel(25))).toBeNull();
    });

    it('loads all flows to find this one', () => {
      renderPage();

      expect(mockedUseQuery).toHaveBeenCalledWith(
        SubscriptionFlowsDocument,
        expect.objectContaining({
          variables: { defaultFlowOnly: false },
        })
      );
    });

    it('lets the conditions of the flow be changed', () => {
      renderPage();

      expect(screen.getByText('subscriptionFlow.paymentMethod')).toBeTruthy();
      expect(screen.getByText('subscriptionFlow.periodicity')).toBeTruthy();
    });

    it('names the button that deletes the flow', () => {
      renderAuthorised();

      expect(screen.getAllByRole('button', { name: 'delete' })).toHaveLength(1);
    });

    it('goes back to the overview once the flow is deleted', () => {
      renderPage();

      const [, options] = (useMutation as unknown as Mock).mock.calls.find(
        ([document]) => document === DeleteSubscriptionFlowDocument
      ) as [unknown, { onCompleted: () => void }];

      options.onCompleted();

      expect(navigate).toHaveBeenCalledWith('/communicationflows');
    });

    it('removes the custom mail of a day from the timeline', () => {
      renderPage();

      const removeButtons = screen.getAllByLabelText(
        'subscriptionFlow.deleteMail'
      );

      expect(removeButtons).toHaveLength(1);

      fireEvent.click(removeButtons[0]);

      expect(
        mutationFor(DeleteSubscriptionIntervalDocument)
      ).toHaveBeenCalledWith({ variables: { id: 'i-3' } });
    });
  });

  describe('for a flow that does not exist', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'gone' });
      mockQueries([defaultFlow, customFlow]);
    });

    it('says so and leads back to the overview', () => {
      renderPage();

      expect(screen.getByText('subscriptionFlow.notFound')).toBeTruthy();
      expect(screen.queryByRole('region')).toBeNull();
      expect(
        screen
          .getByRole('link', { name: 'subscriptionFlow.overview.back' })
          .getAttribute('href')
      ).toBe('/communicationflows');
    });
  });
});
