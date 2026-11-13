import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TEST_CAPTCHA_LABEL,
  mockChallenge,
  mockChallengeQuery,
  mockChallengeToken,
  mockEngagementAction,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockImage,
  mockOperation,
  mockUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  EngagementActionRole,
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

  it('names a modal without a title by its call to action', () => {
    renderWithProviders(
      <EngagementPrompt
        prompt={mockEngagementPrompt({
          stage: { title: null, cta: 'Every Friday in your inbox.' },
        })}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'Every Friday in your inbox.' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Every Friday in your inbox.')).toHaveLength(1);
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

  it('closes the prompt with a cancel action instead of following it', () => {
    const onDismiss = vi.fn();

    renderWithProviders(
      <EngagementPrompt
        prompt={mockEngagementPrompt({
          stage: {
            placement: EngagementPlacement.Inline,
            actions: [
              mockEngagementAction({
                label: 'Not now',
                url: '',
                role: EngagementActionRole.Cancel,
              }),
            ],
          },
        })}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Not now').closest('a')).toBeNull();
    fireEvent.click(screen.getByText('Not now'));

    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText('Not now')).toBeNull();
  });

  describe('newsletter action without a url', () => {
    const signUp = (email: string) =>
      mockOperation(SignUpForNewsletterDocument, {
        variables: {
          email,
          challengeAnswer: {
            challengeID: mockChallenge().challengeID,
            challengeSolution: mockChallengeToken,
          },
        },
        data: {
          __typename: 'Mutation',
          signUpForNewsletter: {
            __typename: 'NewsletterSignup',
            newsletterToken: 'signed.token',
          },
        },
      });

    const inPlace = (placement: EngagementPlacement) =>
      mockEngagementPrompt({
        stage: {
          placement,
          actions: [
            mockEngagementAction({
              type: EngagementActionType.Newsletter,
              label: 'Get the newsletter',
              url: '',
            }),
          ],
        },
      });

    beforeEach(() => {
      document.cookie = `${NEWSLETTER_COOKIE_KEY}=; max-age=0; path=/`;
    });

    it('asks for the email right in a box in the article, then thanks', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();

      renderWithProviders(
        <EngagementPrompt
          prompt={inPlace(EngagementPlacement.Inline)}
          onAction={onAction}
        />,
        { mocks: [mockChallengeQuery(), signUp('reader@example.com')] }
      );

      expect(
        screen.queryByRole('link', { name: 'Get the newsletter' })
      ).toBeNull();

      await user.type(
        screen.getByRole('textbox', {
          name: t('engagement.newsletterWall.email'),
        }),
        'reader@example.com'
      );
      await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
      await user.click(
        screen.getByRole('button', { name: 'Get the newsletter' })
      );

      expect(
        await screen.findByText(t('engagement.newsletterWall.done'))
      ).toBeInTheDocument();
      expect(readNewsletterToken()).toBe('signed.token');
      expect(onAction).toHaveBeenCalled();
    });

    it('asks for the email in a pop-up too', () => {
      renderWithProviders(
        <EngagementPrompt prompt={inPlace(EngagementPlacement.Modal)} />,
        { mocks: [mockChallengeQuery()] }
      );

      expect(
        within(screen.getByRole('dialog')).getByRole('textbox', {
          name: t('engagement.newsletterWall.email'),
        })
      ).toBeInTheDocument();
    });
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

  it('leads monthly subscribers to switching their subscription to yearly', () => {
    renderWithProviders(
      <EngagementPrompt
        prompt={mockEngagementPrompt({
          stage: {
            placement: EngagementPlacement.Banner,
            actions: [
              mockEngagementAction({
                id: 'switch',
                type: EngagementActionType.SwitchToYearly,
                label: '',
                url: '/profile/subscription/sub-1?switchTo=yearly',
              }),
              mockEngagementAction({
                id: 'fallback',
                type: EngagementActionType.SwitchToYearly,
                label: 'My subscriptions',
                url: '',
                role: EngagementActionRole.Other,
              }),
            ],
          },
        })}
      />
    );

    expect(linkOf(t('engagement.action.SWITCH_TO_YEARLY'))).toBe(
      '/profile/subscription/sub-1?switchTo=yearly'
    );
    expect(linkOf('My subscriptions')).toBe('/profile');
  });

  describe('newsletter wall', () => {
    const wall = () =>
      mockHardEngagementPrompt({
        title: 'Get our newsletter to keep reading',
        requirement: EngagementRequirement.Newsletter,
        actions: [],
      });

    const solved = {
      challengeID: mockChallenge().challengeID,
      challengeSolution: mockChallengeToken,
    };

    const signedUp = mockOperation(SignUpForNewsletterDocument, {
      variables: { email: 'reader@example.com', challengeAnswer: solved },
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
        mocks: [mockChallengeQuery(), signedUp],
      });

      await user.type(emailInput(), 'reader@example.com');
      await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
      await user.click(
        screen.getByRole('button', {
          name: t('engagement.newsletterWall.submit'),
        })
      );

      await waitFor(() => expect(readNewsletterToken()).toBe('signed.token'));
      // No second signup while the article is viewed again.
      expect(
        screen.getByText(t('engagement.newsletterWall.done'))
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: t('engagement.newsletterWall.submit'),
        })
      ).toBeNull();
    });

    it('fills in the email of a logged-in reader, who solves no challenge', async () => {
      const user = userEvent.setup();

      renderWithProviders(<EngagementPrompt prompt={wall()} />, {
        user: mockUser({ email: 'member@example.com' }) as never,
        mocks: [
          mockOperation(SignUpForNewsletterDocument, {
            variables: { email: 'member@example.com' },
            data: {
              __typename: 'Mutation',
              signUpForNewsletter: {
                __typename: 'NewsletterSignup',
                newsletterToken: 'member.token',
              },
            },
          }),
        ],
      });

      expect(emailInput()).toHaveValue('member@example.com');
      expect(
        screen.queryByRole('group', { name: TEST_CAPTCHA_LABEL })
      ).toBeNull();

      await user.click(
        screen.getByRole('button', {
          name: t('engagement.newsletterWall.submit'),
        })
      );

      await waitFor(() => expect(readNewsletterToken()).toBe('member.token'));
    });

    it('says when the signup failed and lets the reader try again', async () => {
      const user = userEvent.setup();

      renderWithProviders(<EngagementPrompt prompt={wall()} />, {
        mocks: [
          mockChallengeQuery(),
          mockOperation(SignUpForNewsletterDocument, {
            variables: { email: 'reader@example', challengeAnswer: solved },
            errors: [{ message: 'Invalid email address.' }],
          }),
        ],
      });

      await user.type(emailInput(), 'reader@example');
      await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
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
