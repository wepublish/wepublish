import { ComponentConfig } from '@puckeditor/core';
import {
  FacebookPostBlock,
  FacebookVideoBlock,
  InstagramPostBlock,
} from '@wepublish/block-content/website';
import {
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderInstagramPostBlockProps,
} from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const FacebookVideoConfig: ComponentConfig<{
  props: BuilderFacebookVideoBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a Facebook video. Set userID to the page or user identifier and videoID to the numeric video identifier, both taken from the Facebook video URL "facebook.com/userID/videos/videoID".',
  },
  fields: {
    videoID: {
      type: 'text',
    },
    userID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: FacebookVideoBlock,
};

export const FacebookConfig: ComponentConfig<{
  props: BuilderFacebookPostBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a Facebook post. Set userID to the page or user identifier and postID to the numeric post identifier, both taken from the Facebook post URL "facebook.com/userID/posts/postID".',
  },
  fields: {
    postID: {
      type: 'text',
    },
    userID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: FacebookPostBlock,
};

export const InstagramConfig: ComponentConfig<{
  props: BuilderInstagramPostBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds an Instagram post. Set postID to the post shortcode found in the Instagram URL "instagram.com/p/postID" (for example "CabcDefghij").',
  },
  fields: {
    postID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: InstagramPostBlock as ComponentConfig<{
    props: BuilderInstagramPostBlockProps;
    fields: UserFields;
  }>['render'],
};
