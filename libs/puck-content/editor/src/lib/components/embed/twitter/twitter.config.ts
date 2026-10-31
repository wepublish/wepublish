import { ComponentConfig } from '@puckeditor/core';
import { TwitterRender } from '@wepublish/puck-content/website';
import { BuilderTwitterTweetBlockProps } from '@wepublish/website/builder';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

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

  render: editorRender(TwitterRender),
};
