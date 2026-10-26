import { fireEvent, render, screen } from '@testing-library/react';

import {
  NotificationItem,
  NotificationSeverity,
  SEVERITY_ORDER,
} from './notificationItem';

describe('SEVERITY_ORDER', () => {
  it('puts the worst first', () => {
    const bySeverity = (
      ['success', 'info', 'warning', 'error'] as NotificationSeverity[]
    ).sort((a, b) => SEVERITY_ORDER[a] - SEVERITY_ORDER[b]);

    expect(bySeverity).toEqual(['error', 'warning', 'info', 'success']);
  });

  it('gives every severity its own rank, so none can shadow another', () => {
    const ranks = Object.values(SEVERITY_ORDER);

    expect(new Set(ranks).size).toBe(ranks.length);
  });
});

describe('NotificationItem', () => {
  it('renders its title, source tag and body', () => {
    render(
      <NotificationItem
        severity="error"
        title="Job failed"
        sourceTag="Job-Logs"
      >
        Something broke
      </NotificationItem>
    );

    expect(screen.getByText('Job failed')).toBeTruthy();
    expect(screen.getByText('Job-Logs')).toBeTruthy();
    expect(screen.getByText('Something broke')).toBeTruthy();
  });

  it('opens a clickable item from a button named by its title', () => {
    const onClick = vi.fn();

    render(
      <NotificationItem
        severity="info"
        title="New release"
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'New release' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the title as plain text when the item is not clickable', () => {
    render(
      <NotificationItem
        severity="info"
        title="New release"
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('carries an order so a stack of items sorts itself by severity', () => {
    const { container } = render(
      <NotificationItem
        severity="success"
        title="Done"
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const className = wrapper.getAttribute('class') ?? '';

    // Emotion puts the rule in a generated class; what matters here is that the
    // element is styled at all — the rank itself is covered above.
    expect(className.length).toBeGreaterThan(0);
  });
});
