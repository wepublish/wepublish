import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliveryChannelHistoryView } from './delivery-channel-history-view';

const queries = vi.fn();
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
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => letterChannel(),
}));

vi.mock('./use-audience-lookups', () => ({
  useAudienceLookups: () => ({
    t: (key: string) => key,
    memberPlans: new Map([['plan-1', 'Jahresabo']]),
    paymentMethods: new Map(),
    templates: new Map([['tpl-1', 'Adressänderung']]),
    formatDate: (iso: string) => iso,
  }),
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

let totalCount = 1;

const answer = (name: string) =>
  name === 'DeliveryModeBulkChanges' ?
    {
      data: { deliveryModeBulkChanges: { nodes: [change], totalCount } },
      loading: false,
    }
  : {};

const variablesOf = () =>
  queries.mock.calls
    .filter(([name]) => name === 'DeliveryModeBulkChanges')
    .map(([, options]) => (options as { variables?: unknown })?.variables);

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <DeliveryChannelHistoryView />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('DeliveryChannelHistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    totalCount = 1;
    queries.mockImplementation(answer);
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });
  });

  afterEach(cleanup);

  it('names the record for what it holds, until the log is unified', () => {
    renderView();

    expect(screen.getByText('deliveryMode.bulk.history.title')).toBeTruthy();
  });

  it('lists when, by whom, to which channel, the audience and the numbers', () => {
    renderView();

    expect(
      screen.getByRole('link', { name: 'Anna Admin' }).getAttribute('href')
    ).toBe('/users/edit/admin');
    // The channel is also a filter button; the row shows it as a chip.
    const row = within(
      screen
        .getByRole('link', { name: 'Anna Admin' })
        .closest('tr') as HTMLElement
    );
    expect(row.getByText('deliveryMode.channel.letter')).toBeTruthy();
    expect(screen.getByText('mailSend.base.hasSubscription')).toBeTruthy();
    expect(
      screen.getByText('mailSend.audienceSummary.memberPlans: Jahresabo')
    ).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('pages twenty at a time, newest first', () => {
    totalCount = 45;
    renderView();

    expect(variablesOf()[0]).toEqual({ skip: 0, take: 20, channel: undefined });

    fireEvent.click(screen.getByRole('button', { name: /page 2/i }));

    expect(variablesOf().at(-1)).toEqual(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });

  it('narrows to one channel, and starts the pages over', () => {
    totalCount = 45;
    renderView();
    fireEvent.click(screen.getByRole('button', { name: /page 2/i }));

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.channel.letter' })
    );

    expect(variablesOf().at(-1)).toEqual(
      expect.objectContaining({ skip: 0, channel: 'letter' })
    );
  });

  it('offers every channel of the medium as a filter, and all of them', () => {
    renderView();

    expect(
      screen.getByRole('button', {
        name: 'deliveryChannel.history.allChannels',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'deliveryMode.channel.mail' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'deliveryMode.channel.letter' })
    ).toBeTruthy();
  });

  it('says so when nothing was switched yet', () => {
    queries.mockImplementation((name: string) =>
      name === 'DeliveryModeBulkChanges' ?
        {
          data: { deliveryModeBulkChanges: { nodes: [], totalCount: 0 } },
          loading: false,
        }
      : {}
    );
    renderView();

    expect(screen.getByText('deliveryMode.bulk.history.empty')).toBeTruthy();
  });
});
