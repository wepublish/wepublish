import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliveryModeBulkChanges } from './delivery-mode-bulk-changes';

const queries = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: 'de' },
  }),
}));

const change = {
  id: 'change-1',
  createdAt: '2026-10-17T08:30:00.000Z',
  channel: 'letter',
  audience: {
    base: 'hasSubscription',
    memberPlanIDs: ['plan-1'],
    mailHistory: {
      match: 'all',
      conditions: [{ mailTemplateId: 'tpl-1', negate: true }],
    },
  },
  userCount: 12,
  changed: 10,
  skippedWithoutAddress: 2,
  changedBy: { id: 'admin', email: 'a@x.ch', name: 'Admin', firstName: 'Anna' },
};

const answer = (name: string, options: any) => {
  switch (name) {
    case 'DeliveryModeBulkChanges':
      return {
        data: { deliveryModeBulkChanges: { nodes: [change], totalCount: 1 } },
        loading: false,
        refetch: vi.fn(),
        variables: options?.variables,
      };
    case 'MemberPlanList':
      return {
        data: { memberPlans: { nodes: [{ id: 'plan-1', name: 'Jahresabo' }] } },
      };
    case 'PaymentMethodList':
      return { data: { paymentMethods: [] } };
    case 'MailTemplate':
      return {
        data: { mailTemplates: [{ id: 'tpl-1', name: 'Adressänderung' }] },
      };
    default:
      return { data: undefined };
  }
};

const renderTable = (refreshKey = 0) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <DeliveryModeBulkChanges refreshKey={refreshKey} />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('DeliveryModeBulkChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.mockImplementation(answer);
  });

  afterEach(cleanup);

  it('lists who switched which audience, with the filter spelled out', () => {
    renderTable();

    expect(screen.getByText('Anna Admin')).toBeTruthy();
    expect(screen.getByText('deliveryMode.channel.letter')).toBeTruthy();
    expect(screen.getByText('mailSend.base.hasSubscription')).toBeTruthy();
    expect(
      screen.getByText('mailSend.audienceSummary.memberPlans: Jahresabo')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'mailSend.audienceSummary.mailHistory: mailSend.audienceSummary.notReceived «Adressänderung»'
      )
    ).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('asks for the twenty most recent and refetches when told', () => {
    const { rerender } = renderTable();

    const call = () =>
      queries.mock.calls.filter(([name]) => name === 'DeliveryModeBulkChanges');

    expect(call()[0][1]).toEqual(
      expect.objectContaining({
        variables: { skip: 0, take: 20 },
        fetchPolicy: 'cache-and-network',
      })
    );

    const before = call().length;
    rerender(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MemoryRouter>
          <DeliveryModeBulkChanges refreshKey={1} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(call().length).toBeGreaterThan(before);
  });

  it('says so when nothing was switched yet', () => {
    queries.mockImplementation((name: string, options: any) =>
      name === 'DeliveryModeBulkChanges' ?
        {
          data: { deliveryModeBulkChanges: { nodes: [], totalCount: 0 } },
          loading: false,
          refetch: vi.fn(),
        }
      : answer(name, options)
    );

    renderTable();

    expect(screen.getByText('deliveryMode.bulk.history.empty')).toBeTruthy();
  });
});
