import type { Tweet, TweetUser } from 'react-tweet/api';
import { MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

export const mockTweetUser = (
  overrides: Partial<TweetUser> = {}
): TweetUser => ({
  id_str: '1157234539553824768',
  name: 'We.Publish',
  screen_name: 'WePublish_media',
  profile_image_url_https: 'https://unsplash.it/200/200?key=tweet-user',
  profile_image_shape: 'Circle',
  verified: false,
  is_blue_verified: false,
  ...definedOnly(overrides),
});

export const mockTweet = ({
  text = 'We.Publish is an open source platform for independent media.',
  ...overrides
}: Partial<Tweet> = {}): Tweet => ({
  __typename: 'Tweet',
  id_str: '1600079498845863937',
  lang: 'en',
  created_at: MOCK_REFERENCE_DATE,
  text,
  display_text_range: [0, text.length],
  entities: { hashtags: [], urls: [], user_mentions: [], symbols: [] },
  user: mockTweetUser(),
  edit_control: {
    edit_tweet_ids: ['1600079498845863937'],
    editable_until_msecs: '0',
    is_edit_eligible: false,
    edits_remaining: '0',
  },
  isEdited: false,
  isStaleEdit: false,
  favorite_count: 12,
  conversation_count: 3,
  news_action_type: 'conversation',
  ...definedOnly(overrides),
});
