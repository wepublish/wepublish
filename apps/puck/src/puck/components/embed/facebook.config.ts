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
