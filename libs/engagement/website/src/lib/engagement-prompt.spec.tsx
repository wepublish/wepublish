import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockEngagementAction,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  EngagementActionType,
  EngagementPlacement,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { EngagementPrompt } from './engagement-prompt';

const inline = () =>
  mockEngagementPrompt({
    stage: {
      placement: EngagementPlacement.Inline,
      image: mockImage(),
      cta: 'Every Friday in your inbox.',
    },
  });

const linkOf = (text: string) =>
  screen.getByText(text).closest('a')?.getAttribute('href');

describe('EngagementPrompt', () => {
  it('shows a soft modal the reader can dismiss', async () => {
    const onDismiss = vi.fn();

    renderWithProviders(
      <EngagementPrompt
        prompt={mockEngagementPrompt()}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Enjoying our journalism?')).toBeInTheDocument();

    fireEvent.click(screen.getByText(t('engagement.dismiss')));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Enjoying our journalism?')).toBeNull()
    );
  });

  it('lets the reader dismiss an inline prompt, which reports the click on an action', () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();

    renderWithProviders(
      <EngagementPrompt
        prompt={inline()}
        onDismiss={onDismiss}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('Subscribe to our newsletter'));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'action-1' })
    );

    fireEvent.click(screen.getByText(t('engagement.dismiss')));
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText('Subscribe to our newsletter')).toBeNull();
  });

  it('offers no dismissal when the prompt can not be dismissed', () => {
    renderWithProviders(
      <EngagementPrompt
        prompt={mockEngagementPrompt({
          stage: { placement: EngagementPlacement.Inline, dismissible: false },
        })}
      />
    );

    expect(screen.queryByText(t('engagement.dismiss'))).toBeNull();
  });

  it('sends readers past a registration cutoff to signup or login', () => {
    renderWithProviders(
      <EngagementPrompt prompt={mockHardEngagementPrompt()} />
    );

    expect(linkOf(t('engagement.action.REGISTER'))).toBe('/signup');
    expect(linkOf(t('engagement.action.LOGIN'))).toBe('/login');
    expect(screen.queryByText(t('engagement.dismiss'))).toBeNull();
  });

  it('sends readers past a membership cutoff to the membership page, keeping the newsletter path open', () => {
    renderWithProviders(
      <EngagementPrompt
        prompt={mockHardEngagementPrompt({
          title: 'Become a member to keep reading',
          actions: [
            mockEngagementAction({
              id: 'membership',
              type: EngagementActionType.Membership,
              label: '',
              url: '',
            }),
            mockEngagementAction({
              id: 'newsletter',
              type: EngagementActionType.Newsletter,
              label: 'Or get our newsletter',
              url: 'https://example.com/newsletter',
            }),
          ],
        })}
      />
    );

    expect(linkOf(t('engagement.action.MEMBERSHIP'))).toBe('/mitmachen');
    expect(linkOf('Or get our newsletter')).toBe(
      'https://example.com/newsletter'
    );
  });
});
