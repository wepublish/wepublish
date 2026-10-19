import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { UserDeliveryModePanel } from './user-delivery-mode-panel';

const queries = vi.fn();
const mutate = vi.fn();
const mutationOptions = vi.fn();
const allowed = vi.fn(() => true);
const snackbar = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: (document: unknown, options?: unknown) => {
    mutationOptions(operationName(document), options);

    return [
      (callOptions?: unknown) => mutate(operationName(document), callOptions),
      { loading: false },
    ];
  },
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => allowed(),
  enqueueSnackbar: (...args: unknown[]) => snackbar(...args),
}));

vi.mock('./use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => true,
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({ paperLetters: true, letterAvailable: true }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const preference = (overrides = {}) => ({
  channel: 'mail',
  origin: null,
  reason: null,
  changedAt: null,
  changedBy: null,
  canReceiveLetters: true,
  ...overrides,
});

const suggestion = {
  id: 's1',
  kind: 'toLetter',
  reason: 'emailQuality:dead',
  createdAt: '2026-10-16T02:00:00.000Z',
  user: { id: 'u1', email: 'jane@example.com', name: 'Doe', firstName: 'Jane' },
  emailQuality: { level: 'dead', reason: 'hardBounce', since: '2026-10-01' },
};

let currentPreference = preference();
let openSuggestion: typeof suggestion | null = null;

const answer = (name: string) => {
  switch (name) {
    case 'UserDeliveryPreference':
      return { data: { userDeliveryPreference: currentPreference } };
    case 'UserDeliverySuggestion':
      return { data: { userDeliverySuggestion: openSuggestion } };
    default:
      return {};
  }
};

const renderPanel = () =>
  render(
    <MemoryRouter>
      <UserDeliveryModePanel userId="u1" />
    </MemoryRouter>
  );

describe('UserDeliveryModePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    currentPreference = preference();
    openSuggestion = null;
    queries.mockImplementation(answer);
  });

  afterEach(cleanup);

  it('offers letters to a user who gets mails and has an address', () => {
    renderPanel();

    expect(screen.getByText('deliveryMode.channel.mail')).toBeTruthy();
    const button = screen.getByRole('button', {
      name: 'deliveryMode.switchToLetter',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith(
      'SetUserDeliveryMode',
      expect.objectContaining({
        variables: { userId: 'u1', channel: 'letter' },
      })
    );
  });

  it('cannot offer letters without a complete postal address', () => {
    currentPreference = preference({ canReceiveLetters: false });
    renderPanel();

    const button = screen.getByRole('button', {
      name: 'deliveryMode.switchToLetter',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText('deliveryMode.noAddress')).toBeTruthy();
  });

  it('says in one line how a letter user got there, and offers the way back', () => {
    currentPreference = preference({
      channel: 'letter',
      origin: 'suggestion',
      reason: 'emailQuality:dead',
      changedAt: '2026-10-16T08:00:00.000Z',
      changedBy: { id: 'a', email: 'a@x.ch', name: 'Admin', firstName: null },
    });
    renderPanel();

    expect(screen.getByText('deliveryMode.channel.letter')).toBeTruthy();
    expect(
      screen.getByText(
        /^deliveryMode\.origin\.suggestion · deliveryMode\.reason\.emailQuality_dead · .+ · Admin$/
      )
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.switchToMail' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'SetUserDeliveryMode',
      expect.objectContaining({
        variables: { userId: 'u1', channel: 'mail' },
      })
    );
  });

  it('says so once a switch went through', () => {
    renderPanel();

    const { onCompleted } = mutationOptions.mock.calls.find(
      ([name]) => name === 'SetUserDeliveryMode'
    )[1];
    act(() =>
      onCompleted({ setUserDeliveryMode: preference({ channel: 'letter' }) })
    );

    expect(snackbar).toHaveBeenCalledWith(
      'deliveryChannel.user.switched:{"channel":"deliveryMode.channel.letter"}',
      expect.objectContaining({ variant: 'success' })
    );
  });

  it('shows the channel to everyone, the switch only to those who may', () => {
    allowed.mockReturnValue(false);
    renderPanel();

    expect(screen.getByText('deliveryMode.channel.mail')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'deliveryMode.switchToLetter' })
    ).toBeNull();
  });

  it('points to where all delivery channels are managed', () => {
    renderPanel();

    expect(
      screen
        .getByRole('link', { name: 'deliveryChannel.user.manageAll' })
        .getAttribute('href')
    ).toBe('/deliverychannel');
  });

  it("shows the person's open suggestion and applies it", () => {
    openSuggestion = suggestion;
    renderPanel();

    expect(
      screen.getByText(
        'deliveryChannel.user.suggestion:{"move":"deliveryMode.switchToLetter"}'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('deliveryMode.reason.emailQuality_dead')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.confirm' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'ConfirmDeliverySuggestion',
      expect.objectContaining({ variables: { id: 's1' } })
    );
  });

  it('keeps the person where they are only after saying what that means', () => {
    openSuggestion = suggestion;
    renderPanel();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryChannel.suggestions.keep' })
    );
    expect(mutate).not.toHaveBeenCalled();

    const dialog = within(screen.getByRole('dialog'));
    expect(
      dialog.getByText(
        'deliveryChannel.suggestions.keepText:{"name":"Jane Doe","channel":"deliveryMode.channel.mail"}'
      )
    ).toBeTruthy();
    fireEvent.click(
      dialog.getByRole('button', {
        name: 'deliveryChannel.suggestions.keepYes',
      })
    );

    expect(mutate).toHaveBeenCalledWith(
      'KeepDeliverySuggestion',
      expect.objectContaining({ variables: { id: 's1' } })
    );
  });

  it('has no suggestion to show when nothing is open', () => {
    renderPanel();

    expect(screen.queryByText(/^deliveryChannel\.user\.suggestion/)).toBeNull();
  });
});
