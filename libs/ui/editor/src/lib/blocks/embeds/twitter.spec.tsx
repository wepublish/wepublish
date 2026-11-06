import { render, screen } from '@testing-library/react';

import { TwitterContext, TwitterTweetEmbed } from './twitter';

describe('TwitterTweetEmbed', () => {
  it('keeps a named fallback link until the widget script replaces it', () => {
    render(
      <TwitterContext.Provider
        value={{ isLoaded: false, isLoading: true, load: vi.fn() }}
      >
        <TwitterTweetEmbed
          userID="wepublish"
          tweetID="123"
        />
      </TwitterContext.Provider>
    );

    expect(
      screen.getByRole('link', { name: 'blocks.embeds.tweetBy' })
    ).toHaveAttribute('href', 'https://twitter.com/wepublish/status/123');
  });
});
