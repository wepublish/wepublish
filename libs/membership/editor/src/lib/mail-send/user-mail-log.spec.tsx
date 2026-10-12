import { render, screen } from '@testing-library/react';

import { UserMailLogPanel } from './user-mail-log';

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
            mailTemplate: { name: 'Welcome' },
          },
        ],
      },
    },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('UserMailLogPanel', () => {
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
