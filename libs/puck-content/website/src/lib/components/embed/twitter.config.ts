import { ComponentConfig } from '@puckeditor/core';
import { TwitterTweetBlock } from '@wepublish/block-content/website';
import { BuilderTwitterTweetBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const TwitterConfig: ComponentConfig<{
  props: BuilderTwitterTweetBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a post from X (formerly Twitter). Set userID to the account handle without the @ and tweetID to the numeric post identifier, both taken from the post URL "x.com/userID/status/tweetID".',
  },
  fields: {
    userID: {
      type: 'text',
      label: 'User',
    },
    tweetID: {
      type: 'text',
      label: 'Post ID',
    },
  },
  defaultProps: {},

  render: TwitterTweetBlock,
};
