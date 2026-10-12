import type { Mock } from 'vitest';
import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  DeleteSubscriptionIntervalDocument,
  ListPaymentMethodsDocument,
  MailTemplateDocument,
  MemberPlanListDocument,
  SubscriptionEvent,
  SubscriptionFlowFragment,
  SubscriptionFlowsDocument,
  SystemMailsDocument,
} from '@wepublish/editor/api';
import { useParams } from 'react-router-dom';

import { SubscriptionFlowList } from './subscription-flow-list';

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
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key,
    i18n: { language: 'en' },
  }),
}));

const page = () => (
  <ThemeProvider theme={createTheme()}>
    <SubscriptionFlowList />
  </ThemeProvider>
);

const renderPage = () => render(page());

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseParams = useParams as unknown as Mock;

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
  }) as unknown as SubscriptionFlowFragment;

const defaultFlow = flow('flow-default', true, [
  interval('i-1', SubscriptionEvent.InvoiceCreation, 0),
  interval('i-2', SubscriptionEvent.DeactivationUnpaid, 25),
]);

const customFlow = flow('flow-a', false, [
  interval('i-3', SubscriptionEvent.Custom, -25),
  interval('i-4', SubscriptionEvent.InvoiceCreation, 0),
  interval('i-5', SubscriptionEvent.DeactivationUnpaid, 5),
]);

function mockQueries(flows: SubscriptionFlowFragment[]) {
  const results = new Map<unknown, unknown>([
    [SubscriptionFlowsDocument, { subscriptionFlows: flows }],
    [MailTemplateDocument, { mailTemplates: [] }],
    [ListPaymentMethodsDocument, { paymentMethods: [] }],
    [
      MemberPlanListDocument,
      { memberPlans: { nodes: [{ id: 'plan', name: 'Probe-Abo' }] } },
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
    refetch: vi.fn(),
  }));
}

const dayLabel = (day: number) => `subscriptionFlow.dayWithNumber(${day})`;

const flowBlock = (name: string) => screen.getByRole('region', { name });

const expand = (name: string) =>
  fireEvent.click(
    within(flowBlock(name)).getByRole('button', { name, expanded: false })
  );

describe('SubscriptionFlowList', () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockedUseParams.mockReset();
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

    it('shows the subscription events before the account mails', () => {
      renderPage();

      const events = screen.getByRole('region', {
        name: 'subscriptionFlow.subscriptionEvents',
      });
      const account = screen.getByRole('region', { name: 'systemMails.title' });

      expect(
        events.compareDocumentPosition(account) &
          Node.DOCUMENT_POSITION_FOLLOWING
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
        screen.getByRole('button', { name: 'subscriptionFlow.addDay' })
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'subscriptionFlow.add' })
      );

      expect(screen.getByText(dayLabel(-3))).toBeTruthy();

      fireEvent.click(
        screen.getByRole('button', { name: 'subscriptionFlow.deleteMail' })
      );

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
        within(dayRow()).getAllByRole('button', {
          name: 'subscriptionFlow.deleteMail',
        })
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
        within(dayRow()).getByRole('button', {
          name: 'subscriptionFlow.deleteMail',
        })
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
        screen.getByRole('button', { name: 'subscriptionFlow.addDay' })
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'subscriptionFlow.add' })
      );

      mockQueries([
        flow('flow-default', true, [
          ...defaultFlow.intervals,
          interval('i-new', SubscriptionEvent.Custom, -3),
        ]),
      ]);
      rerender(page());

      fireEvent.click(
        screen.getByRole('button', { name: 'subscriptionFlow.deleteMail' })
      );

      expect(
        mutationFor(DeleteSubscriptionIntervalDocument)
      ).toHaveBeenCalledWith({ variables: { id: 'i-new' } });

      mockQueries([defaultFlow]);
      rerender(page());

      expect(screen.queryByText(dayLabel(-3))).toBeNull();
    });
  });

  describe('for a member plan', () => {
    beforeEach(() => {
      mockedUseParams.mockReturnValue({ id: 'plan' });
      mockQueries([defaultFlow, customFlow]);
    });

    it('renders one block per flow and one to create a new flow', () => {
      renderPage();

      expect(
        screen.getByRole('region', { name: 'subscriptionFlow.defaultFlow' })
      ).toBeTruthy();
      expect(
        screen.getByRole('region', { name: 'subscriptionFlow.flowNumber(1)' })
      ).toBeTruthy();
      expect(
        screen.getByRole('region', { name: 'subscriptionFlow.newFlow' })
      ).toBeTruthy();
    });

    it('counts the subscriptions of this member plan only', () => {
      renderPage();

      expect(mockedUseQuery).toHaveBeenCalledWith(
        SubscriptionFlowsDocument,
        expect.objectContaining({
          variables: { defaultFlowOnly: false, memberPlanId: 'plan' },
        })
      );
      expect(useMutation).toHaveBeenCalledWith(
        DeleteSubscriptionIntervalDocument,
        expect.objectContaining({ variables: { memberPlanId: 'plan' } })
      );
    });

    it('shows existing flows collapsed and the new flow open', () => {
      renderPage();

      expect(
        within(flowBlock('subscriptionFlow.defaultFlow')).getByRole('button', {
          name: 'subscriptionFlow.defaultFlow',
          expanded: false,
        })
      ).toBeTruthy();
      expect(
        within(flowBlock('subscriptionFlow.flowNumber(1)')).queryByText(
          dayLabel(-25)
        )
      ).toBeNull();
      expect(
        within(flowBlock('subscriptionFlow.newFlow')).getByText(
          'subscriptionFlow.addNew'
        )
      ).toBeTruthy();
    });

    it('opens a flow on click', () => {
      renderPage();

      expand('subscriptionFlow.flowNumber(1)');

      expect(
        within(flowBlock('subscriptionFlow.flowNumber(1)')).getByText(
          dayLabel(-25)
        )
      ).toBeTruthy();
    });

    it('shows a flow open right after it was created', () => {
      const { rerender } = renderPage();

      mockQueries([
        defaultFlow,
        customFlow,
        flow('flow-new', false, [
          interval('i-6', SubscriptionEvent.InvoiceCreation, 0),
        ]),
      ]);
      rerender(page());

      expect(
        within(flowBlock('subscriptionFlow.flowNumber(2)')).getByRole(
          'button',
          { name: 'subscriptionFlow.flowNumber(2)', expanded: true }
        )
      ).toBeTruthy();
      expect(
        within(flowBlock('subscriptionFlow.flowNumber(1)')).getByRole(
          'button',
          { name: 'subscriptionFlow.flowNumber(1)', expanded: false }
        )
      ).toBeTruthy();
    });

    it('shows only the days a flow uses on its own timeline', () => {
      renderPage();
      expand('subscriptionFlow.defaultFlow');
      expand('subscriptionFlow.flowNumber(1)');

      const defaultBlock = screen.getByRole('region', {
        name: 'subscriptionFlow.defaultFlow',
      });
      const customBlock = screen.getByRole('region', {
        name: 'subscriptionFlow.flowNumber(1)',
      });

      expect(within(defaultBlock).queryByText(dayLabel(-25))).toBeNull();
      expect(within(customBlock).getByText(dayLabel(-25))).toBeTruthy();
      expect(within(customBlock).queryByText(dayLabel(25))).toBeNull();
    });

    it('removes the custom mail of a day from the timeline', () => {
      renderPage();
      expand('subscriptionFlow.defaultFlow');
      expand('subscriptionFlow.flowNumber(1)');

      const defaultBlock = screen.getByRole('region', {
        name: 'subscriptionFlow.defaultFlow',
      });
      const customBlock = screen.getByRole('region', {
        name: 'subscriptionFlow.flowNumber(1)',
      });
      const removeButtons = within(customBlock).getAllByRole('button', {
        name: 'subscriptionFlow.deleteMail',
      });

      expect(
        within(defaultBlock).queryAllByRole('button', {
          name: 'subscriptionFlow.deleteMail',
        })
      ).toHaveLength(0);
      expect(removeButtons).toHaveLength(1);

      fireEvent.click(removeButtons[0]);

      expect(
        mutationFor(DeleteSubscriptionIntervalDocument)
      ).toHaveBeenCalledWith({ variables: { id: 'i-3' } });
    });
  });
});
