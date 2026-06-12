import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './twitter-tweet-block.stories';
import { TwitterTweetBlock } from './twitter-tweet-block';

jest.mock('react-tweet', () => ({
  Tweet: () => {
    throw new Error('tweet payload changed');
  },
}));

const storiesCmp = composeStories(stories);

describe('Twitter Tweet Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});

describe('TwitterTweetBlock', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('hides tweet embeds that fail to render', () => {
    expect(() =>
      render(
        <TwitterTweetBlock
          tweetID="123"
          userID={null}
        />
      )
    ).not.toThrow();
  });
});
