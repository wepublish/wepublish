import '@puckeditor/plugin-ai/styles.css';

import { createAiPlugin } from '@puckeditor/plugin-ai';
import { LocalStorageKey } from '@wepublish/editor/api';

export type CreateAIPluginOptions = {
  host: string;
};

export const createAIPlugin = ({ host }: CreateAIPluginOptions) =>
  createAiPlugin({
    host,
    designMode: {
      visible: true,
    },
    prepareRequest: options => {
      const token = localStorage.getItem(LocalStorageKey.SessionToken);

      return {
        ...options,
        headers: {
          ...Object.fromEntries(new Headers(options.headers)),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      };
    },
  });
