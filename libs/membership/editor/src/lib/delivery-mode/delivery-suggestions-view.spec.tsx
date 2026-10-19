import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DeliverySuggestionsView } from './delivery-suggestions-view';

const queries = vi.fn();
const mutate = vi.fn(async () => ({ data: {} }));
const allowed = vi.fn(() => true);

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
  useAuthorisation: () => allowed(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
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

const answer = (name: string, options?: { variables?: { kind?: string } }) => {
  if (name === 'DeliverySuggestionCounts') {
    return { data: { deliverySuggestionCounts: { toLetter: 1, toMail: 0 } } };
  }

  return options?.variables?.kind === 'toLetter' ?
      {
        data: { deliverySuggestions: { nodes: [suggestion], totalCount: 1 } },
        loading: false,
      }
    : {
        data: { deliverySuggestions: { nodes: [], totalCount: 0 } },
        loading: false,
      };
};

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <DeliverySuggestionsView />
      </MemoryRouter>
    </ThemeProvider>
  );

const card = (move: string) =>
  screen
    .getByText(
      new RegExp(`^deliveryChannel\\.suggestions\\.cardTitle:.*${move}`)
    )
    .closest('.MuiCard-root') as HTMLElement;

describe('DeliverySuggestionsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    queries.mockImplementation(answer);
  });

  afterEach(cleanup);

  it('is headed once, with how the suggestions come about', () => {
    renderView();

    expect(
      screen.getByText('deliveryChannel.overview.suggestionsHeading')
    ).toBeTruthy();
    expect(
      screen.getByText('deliveryChannel.suggestions.recomputedDaily')
    ).toBeTruthy();
  });

  it('shows one card per move, the move away from email first, named by what it does', () => {
    renderView();

    const titles = screen
      .getAllByText(/^deliveryChannel\.suggestions\.cardTitle:/)
      .map(element => element.textContent);

    expect(titles).toEqual([
      'deliveryChannel.suggestions.cardTitle:{"move":"deliveryMode.switchToLetter","count":1}',
      'deliveryChannel.suggestions.cardTitle:{"move":"deliveryMode.switchToMail","count":0}',
    ]);
  });

  it('pages each card by twenty', () => {
    renderView();

    expect(
      queries.mock.calls
        .filter(([name]) => name === 'DeliverySuggestions')
        .map(([, options]) => options.variables)
    ).toEqual(
      expect.arrayContaining([
        { kind: 'toLetter', skip: 0, take: 20 },
        { kind: 'toMail', skip: 0, take: 20 },
      ])
    );
  });

  it('lists who, why, how their email address fares and since when', () => {
    renderView();
    const letters = within(card('switchToLetter'));

    expect(letters.getByRole('link', { name: /Jane Doe/ })).toBeTruthy();
    expect(
      letters.getByText('deliveryMode.reason.emailQuality_dead')
    ).toBeTruthy();
    expect(
      letters.getByText(/^deliveryChannel\.suggestions\.emailStatus\.dead:/)
    ).toBeTruthy();
  });

  it('applies one suggestion', () => {
    renderView();

    fireEvent.click(
      within(card('switchToLetter')).getByRole('button', {
        name: 'deliveryMode.confirm',
      })
    );

    expect(mutate).toHaveBeenCalledWith(
      'ConfirmDeliverySuggestion',
      expect.objectContaining({ variables: { id: 's1' } })
    );
  });

  it('keeps someone where they are only after saying what that means', () => {
    renderView();

    fireEvent.click(
      within(card('switchToLetter')).getByRole('button', {
        name: 'deliveryChannel.suggestions.keep',
      })
    );
    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'deliveryChannel.suggestions.keepText:{"name":"Jane Doe","channel":"deliveryMode.channel.mail"}'
      )
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'deliveryChannel.suggestions.keepYes',
      })
    );

    expect(mutate).toHaveBeenCalledWith(
      'KeepDeliverySuggestion',
      expect.objectContaining({ variables: { id: 's1' } })
    );
  });

  it('applies all of a move after asking', () => {
    renderView();

    fireEvent.click(
      within(card('switchToLetter')).getByRole('button', {
        name: 'deliveryMode.confirmAll:{"count":1}',
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.confirmAllYes' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'ConfirmAllDeliverySuggestions',
      expect.objectContaining({ variables: { kind: 'toLetter' } })
    );
  });

  it('says when a move has nothing open, and why that changes', () => {
    renderView();
    const back = within(card('switchToMail'));

    expect(
      back.getByText(
        'deliveryChannel.suggestions.empty:{"channel":"deliveryMode.channel.mail"}'
      )
    ).toBeTruthy();
    expect(
      back.queryByRole('button', { name: /deliveryMode\.confirmAll/ })
    ).toBeNull();
  });

  it('rebuilds the suggestions once for the whole view', () => {
    renderView();

    const recompute = screen.getAllByRole('button', {
      name: 'deliveryMode.recompute',
    });
    expect(recompute).toHaveLength(1);

    fireEvent.click(recompute[0]);

    expect(mutate).toHaveBeenCalledWith(
      'RecomputeDeliverySuggestions',
      expect.anything()
    );
  });

  it('leaves the decisions to people who may change channels, and says so', () => {
    allowed.mockReturnValue(false);
    renderView();

    expect(
      screen.getByText('deliveryChannel.suggestions.readOnly')
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'deliveryMode.confirm' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'deliveryChannel.suggestions.keep' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'deliveryMode.recompute' })
    ).toBeNull();
  });
});
