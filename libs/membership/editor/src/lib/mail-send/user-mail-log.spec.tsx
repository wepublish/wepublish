import { cleanup, render, screen } from '@testing-library/react';

import { UserMailLogPanel } from './user-mail-log';

const paperLetters = vi.fn(() => false);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({
    data: {
      mailLogs: {
        nodes: [
          {
            id: 'log-1',
            sentDate: '2026-10-01T08:00:00.000Z',
            state: 'delivered',
            subject: 'Willkommen',
            channel: 'mail',
            mailTemplate: { name: 'Welcome' },
          },
          {
            id: 'log-2',
            sentDate: '2026-10-02T08:00:00.000Z',
            state: 'delivered',
            subject: 'Rechnung',
            channel: 'letter',
            mailTemplate: { name: 'Invoice' },
          },
        ],
      },
    },
  }),
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({
    paperLetters: paperLetters(),
    letterAvailable: paperLetters(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('UserMailLogPanel', () => {
  beforeEach(() => paperLetters.mockReturnValue(false));

  afterEach(cleanup);

  it('says which channel carried each message once the medium prints letters', () => {
    paperLetters.mockReturnValue(true);
    render(<UserMailLogPanel userId="user-1" />);

    expect(screen.getByText('mailSend.mailHistory.channel')).toBeTruthy();
    // Plain text in a table cell, no pill.
    const letter = screen.getByText('deliveryMode.channel.letter');
    expect(letter.closest('.MuiChip-root')).toBeNull();
    expect(letter.closest('td')?.querySelector('svg')).toBeNull();
    expect(letter.closest('tr')).toContainElement(screen.getByText('Invoice'));
    expect(screen.getByText('deliveryMode.channel.mail')).toBeTruthy();
  });

  it('keeps the table as it was without letters', () => {
    render(<UserMailLogPanel userId="user-1" />);

    expect(screen.queryByText('mailSend.mailHistory.channel')).toBeNull();
    expect(screen.queryByText('deliveryMode.channel.mail')).toBeNull();
  });

  it('scrolls a long history inside the card, keeping the column titles visible', () => {
    render(<UserMailLogPanel userId="user-1" />);

    const table = screen.getByRole('table');
    const container = table.parentElement as HTMLElement;
    const headerCell = screen.getByText('mailLog.sentDate').closest('th');

    expect(getComputedStyle(container).maxHeight).toBe('300px');
    expect(getComputedStyle(container).overflowY).toBe('auto');
    expect(getComputedStyle(headerCell as Element).position).toBe('sticky');
  });
});
