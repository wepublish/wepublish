import { ComponentConfig } from '@puckeditor/core';
import {
  FacebookRender,
  FacebookVideoRender,
  InstagramRender,
} from '@wepublish/puck-content/website';
import {
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderInstagramPostBlockProps,
} from '@wepublish/website/builder';
import { SiFacebook, SiInstagram } from 'react-icons/si';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const FacebookVideoConfig: ComponentConfig<{
  props: BuilderFacebookVideoBlockProps;
  fields: UserFields;
}> = {
  icon: SiFacebook,
  category: 'media',
  order: 5,
  nameKey: 'puck.blocks.names.FacebookVideo',
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

  render: editorRender(FacebookVideoRender),
};

export const FacebookConfig: ComponentConfig<{
  props: BuilderFacebookPostBlockProps;
  fields: UserFields;
}> = {
  icon: SiFacebook,
  category: 'embed',
  order: 1,
  nameKey: 'puck.blocks.names.Facebook',
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

  render: editorRender(FacebookRender),
};

export const InstagramConfig: ComponentConfig<{
  props: BuilderInstagramPostBlockProps;
  fields: UserFields;
}> = {
  icon: SiInstagram,
  category: 'embed',
  order: 2,
  nameKey: 'puck.blocks.names.Instagram',
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

  render: editorRender(InstagramRender),
};
