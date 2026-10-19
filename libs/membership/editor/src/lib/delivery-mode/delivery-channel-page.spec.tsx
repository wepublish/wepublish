import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DeliveryChannelPage } from './delivery-channel-page';

const queries = vi.fn();
const allowed = vi.fn(() => true);
const flow = vi.fn(() => true);

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown) => queries(operationName(document)),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => allowed(),
}));

vi.mock('./use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => flow(),
}));

// Each view has its own spec; here they only have to show up in their tab.
vi.mock('./delivery-channel-overview-view', () => ({
  DeliveryChannelOverviewView: () => <div>overview-view</div>,
}));
vi.mock('./delivery-suggestions-view', () => ({
  DeliverySuggestionsView: () => <div>suggestions-view</div>,
}));
vi.mock('./delivery-mode-audience-section', () => ({
  DeliveryModeAudienceSection: () => <div>assign-view</div>,
}));
vi.mock('./delivery-mode-bulk-changes', () => ({
  DeliveryModeBulkChanges: () => <div>history-view</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.count !== undefined ? `${key}:${options.count}` : key,
  }),
}));

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/deliverychannel"
            element={<DeliveryChannelPage />}
          />
          <Route
            path="/deliverychannel/:view"
            element={<DeliveryChannelPage />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const tabs = () => screen.getAllByRole('tab');

describe('DeliveryChannelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    flow.mockReturnValue(true);
    queries.mockImplementation((name: string) =>
      name === 'DeliverySuggestionCounts' ?
        { data: { deliverySuggestionCounts: { toLetter: 2, toMail: 1 } } }
      : {}
    );
  });

  afterEach(cleanup);

  it('names the place and says what it is for', () => {
    renderAt('/deliverychannel');

    expect(screen.getByText('deliveryMode.suggestionsTitle')).toBeTruthy();
    expect(screen.getByText('deliveryMode.suggestionsIntro')).toBeTruthy();
  });

  it('opens on the overview', () => {
    renderAt('/deliverychannel');

    expect(screen.getByText('overview-view')).toBeTruthy();
    expect(
      screen
        .getByRole('tab', { name: 'deliveryChannel.tabs.overview' })
        .getAttribute('aria-selected')
    ).toBe('true');
  });

  it('counts the open suggestions of both directions in their tab', () => {
    renderAt('/deliverychannel');

    expect(
      screen.getByRole('tab', { name: 'deliveryChannel.tabs.suggestions:3' })
    ).toBeTruthy();
  });

  it('gives every view an address of its own', () => {
    renderAt('/deliverychannel');

    expect(tabs().map(tab => tab.getAttribute('href'))).toEqual([
      '/deliverychannel/overview',
      '/deliverychannel/suggestions',
      '/deliverychannel/assign',
      '/deliverychannel/history',
    ]);
  });

  it('shows the view the address names', () => {
    renderAt('/deliverychannel/history');

    expect(screen.getByText('history-view')).toBeTruthy();
    expect(screen.queryByText('suggestions-view')).toBeNull();
    expect(
      screen
        .getByRole('tab', { name: 'deliveryChannel.tabs.history' })
        .getAttribute('aria-selected')
    ).toBe('true');
  });

  it('shows the suggestions under their own address', () => {
    renderAt('/deliverychannel/suggestions');

    expect(screen.getByText('suggestions-view')).toBeTruthy();
  });

  it('falls back to the overview for an address it does not know', () => {
    renderAt('/deliverychannel/nowhere');

    expect(screen.getByText('overview-view')).toBeTruthy();
  });

  it('keeps the switch and its record from people who may not change channels', () => {
    allowed.mockReturnValue(false);
    renderAt('/deliverychannel/assign');

    expect(tabs()).toHaveLength(2);
    expect(screen.getByText('overview-view')).toBeTruthy();
    expect(screen.queryByText('assign-view')).toBeNull();
  });

  it('offers the switch by audience only where letters can be sent', () => {
    flow.mockReturnValue(false);
    renderAt('/deliverychannel');

    expect(tabs().map(tab => tab.getAttribute('href'))).toEqual([
      '/deliverychannel/overview',
      '/deliverychannel/suggestions',
      '/deliverychannel/history',
    ]);
  });
});
