import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliverySuggestionsPage } from './delivery-suggestions-page';

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.count !== undefined ? `${key}:${options.count}` : key,
  }),
}));

const suggestion = {
  id: 's1',
  kind: 'toLetter',
  reason: 'emailQuality:dead',
  createdAt: '2026-10-16T02:00:00.000Z',
  user: { id: 'u1', email: 'jane@example.com', name: 'Doe', firstName: 'Jane' },
  emailQuality: {
    level: 'dead',
    reason: 'hardBounce',
    since: '2026-10-01T00:00:00.000Z',
  },
};

const answer = (name: string) =>
  name === 'DeliverySuggestionCounts' ?
    {
      data: { deliverySuggestionCounts: { toLetter: 1, toMail: 2 } },
      refetch: vi.fn(),
    }
  : {
      data: { deliverySuggestions: { nodes: [suggestion], totalCount: 1 } },
      loading: false,
      refetch: vi.fn(),
    };

const renderPage = () =>
  render(
    <MemoryRouter>
      <DeliverySuggestionsPage />
    </MemoryRouter>
  );

describe('DeliverySuggestionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.mockImplementation((name: string) => answer(name));
  });

  afterEach(cleanup);

  it('lists the suggestions to move to letters first', () => {
    renderPage();

    expect(screen.getByText('jane@example.com')).toBeTruthy();
    expect(
      screen.getByText('deliveryMode.reason.emailQuality_dead')
    ).toBeTruthy();
    expect(
      queries.mock.calls.find(([name]) => name === 'DeliverySuggestions')?.[1]
    ).toEqual(
      expect.objectContaining({
        variables: { kind: 'toLetter', skip: 0, take: 50 },
      })
    );
  });

  it('confirms a single suggestion', () => {
    renderPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.confirm' })
    );

    expect(mutate).toHaveBeenCalledWith('ConfirmDeliverySuggestion', {
      variables: { id: 's1' },
    });
  });

  it('confirms all of the shown kind after asking', () => {
    renderPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.confirmAll:1' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.confirmAllYes' })
    );

    expect(mutate).toHaveBeenCalledWith('ConfirmAllDeliverySuggestions', {
      variables: { kind: 'toLetter' },
    });
  });

  it('switches to the way back', () => {
    renderPage();

    fireEvent.click(screen.getByText('deliveryMode.kind.toMail:2'));

    expect(
      queries.mock.calls
        .filter(([name]) => name === 'DeliverySuggestions')
        .pop()?.[1]
    ).toEqual(
      expect.objectContaining({
        variables: expect.objectContaining({ kind: 'toMail' }),
      })
    );
  });

  it('rebuilds the suggestions on request', () => {
    renderPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.recompute' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'RecomputeDeliverySuggestions',
      undefined
    );
  });
});
