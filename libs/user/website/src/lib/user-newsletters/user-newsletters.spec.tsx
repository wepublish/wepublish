import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockUserNewsletterGroup,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { MailchimpFormOptionsLayout } from '@wepublish/website/api';
import { BuilderUserNewslettersProps } from '@wepublish/website/builder';
import { UserNewsletters } from './user-newsletters';

const renderNewsletters = (
  overrides: Partial<BuilderUserNewslettersProps> = {}
) =>
  renderWithProviders(
    <UserNewsletters
      groups={[mockUserNewsletterGroup()]}
      onSave={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />
  );

const saveButton = () => screen.getByRole('button') as HTMLButtonElement;

const checkbox = (name: RegExp) =>
  screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('UserNewsletters', () => {
  it('ticks the newsletters the user is subscribed to', () => {
    renderNewsletters();

    expect(checkbox(/Daily Briefing/).checked).toBe(true);
    expect(checkbox(/Weekly Digest/).checked).toBe(false);
    expect(checkbox(/Events/).checked).toBe(false);
  });

  it('renders as a list as well', () => {
    renderNewsletters({ layout: MailchimpFormOptionsLayout.List });

    expect(checkbox(/Daily Briefing/).checked).toBe(true);
  });

  it('only allows saving once something changed', () => {
    renderNewsletters();

    expect(saveButton()).toHaveProperty('disabled', true);

    fireEvent.click(checkbox(/Weekly Digest/));
    expect(saveButton()).toHaveProperty('disabled', false);

    fireEvent.click(checkbox(/Weekly Digest/));
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('saves only the changed newsletters', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderNewsletters({ onSave });

    fireEvent.click(checkbox(/Daily Briefing/));
    fireEvent.click(checkbox(/Weekly Digest/));
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
    renderNewsletters({ onSave });

    fireEvent.click(checkbox(/Weekly Digest/));
    fireEvent.click(saveButton());

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Mailchimp is down'
    );
    expect(saveButton()).toHaveProperty('disabled', false);
  });

  it('takes over new groups passed in from outside', () => {
    const group = mockUserNewsletterGroup();
    const { rerender } = renderNewsletters({ groups: [group] });

    fireEvent.click(checkbox(/Events/));
    expect(saveButton()).toHaveProperty('disabled', false);

    rerender(
      <UserNewsletters
        groups={[
          {
            ...group,
            newsletters: group.newsletters.map(newsletter =>
              newsletter.interestId === 'events' ?
                { ...newsletter, subscribed: true }
              : newsletter
            ),
          },
        ]}
        onSave={vi.fn()}
      />
    );

    expect(checkbox(/Events/).checked).toBe(true);
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('renders nothing without newsletters', () => {
    renderNewsletters({ groups: [] });

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
