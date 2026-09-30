import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as stories from './newsletter-list.stories';

const storiesCmp = composeStories(stories);
const {
  Subscribed,
  NotSubscribed,
  Pending,
  Paused,
  LockedTeaser,
  LockedWithoutLink,
  WithError,
} = storiesCmp;

describe('NewsletterList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('subscribes when the switch of a list is turned on', async () => {
    const onSubscribe = vi.fn().mockResolvedValue(undefined);
    render(<NotSubscribed onSubscribe={onSubscribe} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Kulturtipps' }));

    await waitFor(() => expect(onSubscribe).toHaveBeenCalledWith('culture'));
  });

  it('unsubscribes when the switch of a list is turned off', async () => {
    const onUnsubscribe = vi.fn().mockResolvedValue(undefined);
    render(<Subscribed onUnsubscribe={onUnsubscribe} />);

    const toggle = screen.getByRole('checkbox', { name: 'Morgenbriefing' });
    expect(toggle).toHaveProperty('checked', true);

    fireEvent.click(toggle);

    await waitFor(() => expect(onUnsubscribe).toHaveBeenCalledWith('morning'));
  });

  it('asks to confirm a pending sign-up and can resend the mail', async () => {
    const onSubscribe = vi.fn().mockResolvedValue(undefined);
    render(<Pending onSubscribe={onSubscribe} />);

    expect(screen.getByText(/Bitte bestätige deine Anmeldung/)).toBeTruthy();

    fireEvent.click(screen.getByText('E-Mail erneut senden'));

    await waitFor(() => expect(onSubscribe).toHaveBeenCalledWith('weekly'));
  });

  it('lets a paused sign-up be cancelled and promotes the subscription', async () => {
    const onUnsubscribe = vi.fn().mockResolvedValue(undefined);
    render(<Paused onUnsubscribe={onUnsubscribe} />);

    const toggle = screen.getByRole('checkbox', { name: 'Insider Paused' });
    expect(toggle).toHaveProperty('checked', true);
    expect(toggle).toHaveProperty('disabled', false);
    expect(
      screen.getByText(
        'Pausiert – du erhältst diesen Newsletter erst wieder mit einem passenden Abo.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('Jetzt abonnieren').closest('a')?.getAttribute('href')
    ).toBe('/abo');

    fireEvent.click(toggle);

    await waitFor(() =>
      expect(onUnsubscribe).toHaveBeenCalledWith('insider-paused')
    );
  });

  it('greys out a locked list with its promotion and subscribe link', () => {
    render(<LockedTeaser />);

    expect(screen.getByRole('checkbox', { name: 'Insider' })).toHaveProperty(
      'disabled',
      true
    );
    expect(
      screen.getByText('Blick hinter die Kulissen – exklusiv für Mitglieder.')
    ).toBeTruthy();
    expect(
      screen.getByText('Jetzt abonnieren').closest('a')?.getAttribute('href')
    ).toBe('/abo');
  });

  it('falls back to the default promotion and subscribe page', () => {
    render(<LockedWithoutLink />);

    expect(
      screen.getByText(
        'Dieser Newsletter ist Abonnentinnen und Abonnenten vorbehalten.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('Jetzt abonnieren').closest('a')?.getAttribute('href')
    ).toBe('/mitmachen');
  });

  it('shows errors', () => {
    render(<WithError />);

    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });
});
