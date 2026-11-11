import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockEngagementAction,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockImage,
  mockOperation,
  mockUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  EngagementActionType,
  EngagementPlacement,
  EngagementRequirement,
  SignUpForNewsletterDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { EngagementPrompt } from './engagement-prompt';
import {
  NEWSLETTER_COOKIE_KEY,
  readNewsletterToken,
} from './newsletter-signup';

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

  it('adds its own html to pop-ups and boxes in the article', () => {
    for (const placement of [
      EngagementPlacement.Modal,
      EngagementPlacement.Inline,
      EngagementPlacement.Cutoff,
    ]) {
      const { unmount } = renderWithProviders(
        <EngagementPrompt
          prompt={mockEngagementPrompt({
            stage: { placement, html: '<p>Our <b>own</b> markup</p>' },
          })}
        />
      );

      expect(screen.getByText('own').tagName).toBe('B');
      unmount();
    }
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

  describe('newsletter wall', () => {
    const wall = () =>
      mockHardEngagementPrompt({
        title: 'Get our newsletter to keep reading',
        requirement: EngagementRequirement.Newsletter,
        actions: [],
      });

    const signedUp = mockOperation(SignUpForNewsletterDocument, {
      variables: { email: 'reader@example.com' },
      data: {
        __typename: 'Mutation',
        signUpForNewsletter: {
          __typename: 'NewsletterSignup',
          newsletterToken: 'signed.token',
        },
      },
    });

    const emailInput = () =>
      screen.getByRole('textbox', {
        name: t('engagement.newsletterWall.email'),
      });

    beforeEach(() => {
      document.cookie = `${NEWSLETTER_COOKIE_KEY}=; max-age=0; path=/`;
    });

    it('asks for the email alone and remembers the signup in a cookie', async () => {
      const user = userEvent.setup();

      renderWithProviders(<EngagementPrompt prompt={wall()} />, {
        mocks: [signedUp],
      });

      await user.type(emailInput(), 'reader@example.com');
      await user.click(
        screen.getByRole('button', {
          name: t('engagement.newsletterWall.submit'),
        })
      );

      await waitFor(() => expect(readNewsletterToken()).toBe('signed.token'));
    });

    it('fills in the email of a logged-in reader', () => {
      renderWithProviders(<EngagementPrompt prompt={wall()} />, {
        user: mockUser({ email: 'member@example.com' }) as never,
      });

      expect(emailInput()).toHaveValue('member@example.com');
    });

    it('says when the signup failed and lets the reader try again', async () => {
      const user = userEvent.setup();

      renderWithProviders(<EngagementPrompt prompt={wall()} />, {
        mocks: [
          mockOperation(SignUpForNewsletterDocument, {
            variables: { email: 'reader@example' },
            errors: [{ message: 'Invalid email address.' }],
          }),
        ],
      });

      await user.type(emailInput(), 'reader@example');
      await user.click(
        screen.getByRole('button', {
          name: t('engagement.newsletterWall.submit'),
        })
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        t('engagement.newsletterWall.error')
      );
      expect(readNewsletterToken()).toBeUndefined();
    });
  });
});
