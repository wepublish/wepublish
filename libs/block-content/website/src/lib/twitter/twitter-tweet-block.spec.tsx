import { screen } from '@testing-library/react';
import {
  mockTwitterTweetBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { TwitterTweetBlock } from './twitter-tweet-block';

describe('TwitterTweetBlock', () => {
  it('renders the tweet by its id in the dark theme', () => {
    renderWithProviders(
      <TwitterTweetBlock
        {...mockTwitterTweetBlock({ tweetID: '1600079498845863937' })}
      />
    );

    const tweet = screen.getByText(
      `Tweet Mock: ${JSON.stringify({ id: '1600079498845863937' })}`
    );

    expect(tweet.parentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('renders nothing without a tweet id', () => {
    const { container } = renderWithProviders(
      <TwitterTweetBlock {...mockTwitterTweetBlock({ tweetID: null })} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
