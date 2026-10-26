import { MockedProvider } from '@apollo/client/testing/react';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import { clearArticleAccess } from '@wepublish/paywall/website';
import * as stories from './article-container.stories';

const storiesCmp = composeStories(stories);

const renderStory = (Component: (typeof storiesCmp)[keyof typeof storiesCmp]) =>
  render(
    <MockedProvider {...Component.parameters?.apolloClient}>
      <Component />
    </MockedProvider>
  );

describe('Article Container', () => {
  beforeEach(() => {
    localStorage.clear();
    clearArticleAccess();
  });

  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      renderStory(Component);
    });
  });

  it('shows a soft modal the server answered', async () => {
    renderStory(storiesCmp.WithSoftModal);

    // The mock article has every kind of block, which takes a while to render.
    expect(
      await screen.findByText('Enjoying our journalism?', {}, { timeout: 5000 })
    ).toBeTruthy();
  });

  it('shows the cutoff of a hard stage after the preview, and no modal', async () => {
    renderStory(storiesCmp.WithHardCutoff);

    expect(await screen.findByText('Register to keep reading')).toBeTruthy();
    expect(screen.getByText('Kostenlos registrieren')).toBeTruthy();
    expect(screen.queryByText('Enjoying our journalism?')).toBeNull();
  });

  it('shows the paywall of an enforced paywall the server restricted', async () => {
    renderStory(storiesCmp.WithEnforcedPaywall);

    expect(await screen.findByText('Abonnent*in werden')).toBeTruthy();
  });

  it('keeps the paywall away from articles the server granted', async () => {
    renderStory(storiesCmp.ById);

    await waitFor(() =>
      expect(localStorage.getItem('engagement-meter')).toBe('meter-token')
    );
    expect(screen.queryByText('Abonnent*in werden')).toBeNull();
  });

  it('shows an announcement as banner', async () => {
    renderStory(storiesCmp.WithAnnouncementBanner);

    expect(
      await screen.findByText('Our annual crowdfunding', {}, { timeout: 5000 })
    ).toBeTruthy();
  });
});
