import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as stories from './user-newsletters.stories';

const { Default, AsList, Empty } = composeStories(stories);

const saveButton = () => screen.getByRole('button') as HTMLButtonElement;

describe('UserNewsletters', () => {
  it('ticks the newsletters the user is subscribed to', () => {
    render(<Default />);

    expect(
      (
        screen.getByRole('checkbox', {
          name: /Daily Briefing/,
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
    expect(
      (
        screen.getByRole('checkbox', {
          name: /Weekly Digest/,
        }) as HTMLInputElement
      ).checked
    ).toBe(false);
    expect(
      (screen.getByRole('checkbox', { name: /Events/ }) as HTMLInputElement)
        .checked
    ).toBe(false);
  });

  it('renders as a list as well', () => {
    render(<AsList />);

    expect(
      (
        screen.getByRole('checkbox', {
          name: /Daily Briefing/,
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
  });

  it('only allows saving once something changed', () => {
    render(<Default />);

    expect(saveButton()).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('checkbox', { name: /Weekly Digest/ }));
    expect(saveButton()).toHaveProperty('disabled', false);

    fireEvent.click(screen.getByRole('checkbox', { name: /Weekly Digest/ }));
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('saves only the changed newsletters', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<Default onSave={onSave} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Daily Briefing/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Weekly Digest/ }));
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        syncProviderId: 'mailchimp-sync',
        newsletters: [
          { interestId: 'daily', subscribed: false },
          { interestId: 'weekly', subscribed: true },
        ],
      })
    );
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('shows an error when saving fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Mailchimp is down'));
    render(<Default onSave={onSave} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Weekly Digest/ }));
    fireEvent.click(saveButton());

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Mailchimp is down'
    );
    expect(saveButton()).toHaveProperty('disabled', false);
  });

  it('renders nothing without newsletters', () => {
    render(<Empty />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
