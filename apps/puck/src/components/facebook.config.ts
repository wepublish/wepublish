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

export const FacebookVideoConfig: ComponentConfig<BuilderFacebookVideoBlockProps> =
  {
    fields: {
      videoID: {
        type: 'text',
      },
      userID: {
        type: 'text',
      },
    },
    defaultProps: {},
    inline: true,
    render: FacebookVideoBlock,
  };

export const FacebookConfig: ComponentConfig<BuilderFacebookPostBlockProps> = {
  fields: {
    postID: {
      type: 'text',
    },
    userID: {
      type: 'text',
    },
  },
  defaultProps: {},
  inline: true,
  render: FacebookPostBlock,
};

export const InstagramConfig: ComponentConfig<BuilderInstagramPostBlockProps> =
  {
    fields: {
      postID: {
        type: 'text',
      },
    },
    defaultProps: {},
    inline: true,
    render: InstagramPostBlock,
  };
