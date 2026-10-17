import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { UserDeliveryModePanel } from './user-delivery-mode-panel';

const useQuery = vi.fn();
const mutate = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (...args: unknown[]) => useQuery(...args),
  useMutation: () => [mutate, { loading: false }],
}));

vi.mock('./use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

describe('UserDeliveryModePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('offers letters to a user who gets mails and has an address', () => {
    useQuery.mockReturnValue({
      data: { userDeliveryPreference: preference() },
      refetch: vi.fn(),
    });

    render(<UserDeliveryModePanel userId="u1" />);

    expect(screen.getByText('deliveryMode.channel.mail')).toBeTruthy();
    const button = screen.getByRole('button', {
      name: 'deliveryMode.switchToLetter',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { userId: 'u1', channel: 'letter' },
      })
    );
  });

  it('cannot offer letters without a usable address', () => {
    useQuery.mockReturnValue({
      data: {
        userDeliveryPreference: preference({ canReceiveLetters: false }),
      },
      refetch: vi.fn(),
    });

    render(<UserDeliveryModePanel userId="u1" />);

    const button = screen.getByRole('button', {
      name: 'deliveryMode.switchToLetter',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText('deliveryMode.noAddress')).toBeTruthy();
  });

  it('shows who switched a letter user and offers the way back', () => {
    useQuery.mockReturnValue({
      data: {
        userDeliveryPreference: preference({
          channel: 'letter',
          origin: 'suggestion',
          reason: 'emailQuality:dead',
          changedAt: '2026-10-16T08:00:00.000Z',
          changedBy: {
            id: 'a',
            email: 'a@x.ch',
            name: 'Admin',
            firstName: null,
          },
        }),
      },
      refetch: vi.fn(),
    });

    render(<UserDeliveryModePanel userId="u1" />);

    expect(screen.getByText('deliveryMode.channel.letter')).toBeTruthy();
    expect(screen.getByText('deliveryMode.origin.suggestion')).toBeTruthy();
    expect(
      screen.getByText('deliveryMode.reason.emailQuality_dead')
    ).toBeTruthy();
    expect(screen.getByText(/Admin/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.switchToMail' })
    );

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { userId: 'u1', channel: 'mail' },
      })
    );
  });
});
