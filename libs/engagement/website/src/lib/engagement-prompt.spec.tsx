import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as stories from './engagement-prompt.stories';

const storiesCmp = composeStories(stories);
const { Modal, Inline, NotDismissible, HardCutoff, HardCutoffForMembers } =
  storiesCmp;

describe('EngagementPrompt', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('shows a soft modal the reader can dismiss', async () => {
    const onDismiss = vi.fn();
    render(<Modal onDismiss={onDismiss} />);

    expect(screen.getByText('Enjoying our journalism?')).toBeTruthy();

    fireEvent.click(screen.getByText('Weiterlesen'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Enjoying our journalism?')).toBeNull()
    );
  });

  it('lets the reader dismiss an inline prompt, which reports the click on an action', () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    render(
      <Inline
        onDismiss={onDismiss}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('Subscribe to our newsletter'));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'action-1' })
    );

    fireEvent.click(screen.getByText('Weiterlesen'));
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText('Subscribe to our newsletter')).toBeNull();
  });

  it('offers no dismissal when the prompt can not be dismissed', () => {
    render(<NotDismissible />);

    expect(screen.queryByText('Weiterlesen')).toBeNull();
  });

  it('sends readers past a registration cutoff to signup or login', () => {
    render(<HardCutoff />);

    expect(
      screen
        .getByText('Kostenlos registrieren')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('/signup');
    expect(screen.getByText('Login').closest('a')?.getAttribute('href')).toBe(
      '/login'
    );
    expect(screen.queryByText('Weiterlesen')).toBeNull();
  });

  it('sends readers past a membership cutoff to the membership page, keeping the newsletter path open', () => {
    render(<HardCutoffForMembers />);

    expect(
      screen.getByText('Abonnent*in werden').closest('a')?.getAttribute('href')
    ).toBe('/mitmachen');
    expect(
      screen
        .getByText('Or get our newsletter')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('https://example.com/newsletter');
  });
});
