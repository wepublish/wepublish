import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';

import {
  UserDeliveryChannelControls,
  UserDeliveryChannelNotes,
} from './user-delivery-mode-panel';

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
  emailSegment: 'active',
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

const renderControls = () =>
  render(<UserDeliveryChannelControls userId="u1" />);
const renderNotes = () => render(<UserDeliveryChannelNotes userId="u1" />);

describe('UserDeliveryChannelControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    currentPreference = preference();
    openSuggestion = null;
    queries.mockImplementation(answer);
  });

  afterEach(cleanup);

  const pill = (channel: string) =>
    screen
      .getByText(`deliveryMode.channel.${channel}`)
      .closest('.MuiChip-root') as HTMLElement;

  it('names the setting and shows every channel as a pill, the current one filled', () => {
    renderControls();

    expect(screen.getByText('deliveryChannel.user.channelLabel')).toBeTruthy();
    expect(pill('mail').className).toMatch(/MuiChip-filled/);
    expect(pill('letter').className).toMatch(/MuiChip-outlined/);
    // Both carry their channel's icon, so they read as one pair.
    expect(pill('mail').querySelector('svg')).toBeTruthy();
    expect(pill('letter').querySelector('svg')).toBeTruthy();
  });

  it('switches by clicking the other pill', () => {
    renderControls();

    // Only the other pill invites a click (pointer, hover tint).
    expect(pill('letter').className).toMatch(/MuiChip-clickable/);
    expect(pill('mail').className).not.toMatch(/MuiChip-clickable/);
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.channel.letter' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'SetUserDeliveryMode',
      expect.objectContaining({
        variables: { userId: 'u1', channel: 'letter' },
      })
    );
  });

  it('cannot offer letters without a complete postal address', () => {
    currentPreference = preference({ canReceiveLetters: false });
    renderControls();

    expect(pill('letter').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(pill('letter'));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('offers the way back to a letter user', () => {
    currentPreference = preference({ channel: 'letter' });
    renderControls();

    expect(pill('letter').className).toMatch(/MuiChip-filled/);
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.channel.mail' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'SetUserDeliveryMode',
      expect.objectContaining({ variables: { userId: 'u1', channel: 'mail' } })
    );
  });

  it('says so once a switch went through', () => {
    renderControls();

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

  it('shows the pair to everyone, but only those who may can click', () => {
    allowed.mockReturnValue(false);
    renderControls();

    expect(pill('mail')).toBeTruthy();
    expect(pill('letter')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('no longer points anywhere else', () => {
    renderControls();

    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('UserDeliveryChannelNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowed.mockReturnValue(true);
    currentPreference = preference();
    openSuggestion = null;
    queries.mockImplementation(answer);
  });

  afterEach(cleanup);

  it('keeps how the person got there to the overview', () => {
    currentPreference = preference({
      channel: 'letter',
      origin: 'suggestion',
      reason: 'emailQuality:dead',
      changedAt: '2026-10-16T08:00:00.000Z',
      changedBy: { id: 'a', email: 'a@x.ch', name: 'Admin', firstName: null },
    });
    const { container } = renderNotes();

    expect(screen.queryByText(/deliveryMode\.origin\./)).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('says why letters are out of reach', () => {
    currentPreference = preference({ canReceiveLetters: false });
    renderNotes();

    expect(screen.getByText('deliveryMode.noAddress')).toBeTruthy();
  });

  it.each(['placeholder', 'dead'])(
    'says that email does not reach a %s address, without refusing it',
    segment => {
      currentPreference = preference({
        channel: 'letter',
        emailSegment: segment,
      });
      renderNotes();

      expect(
        screen.getByText(
          `deliveryChannel.user.emailUnreachable:{"segment":"mailSend.emailSegments.${segment}"}`
        )
      ).toBeTruthy();
    }
  );

  it('says nothing about a reachable address', () => {
    currentPreference = preference({
      channel: 'letter',
      emailSegment: 'active',
    });
    const { container } = renderNotes();

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the person's open suggestion and applies it", () => {
    openSuggestion = suggestion;
    renderNotes();

    expect(
      screen.getByText(
        'deliveryChannel.user.suggestion:{"move":"deliveryMode.switchToLetter"}'
      )
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
    renderNotes();

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

  it('takes no room when there is nothing to say', () => {
    const { container } = renderNotes();

    expect(container).toBeEmptyDOMElement();
  });
});
