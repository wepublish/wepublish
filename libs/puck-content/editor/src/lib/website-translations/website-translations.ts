import { Plugin } from '@puckeditor/core';

import { WebsiteTranslationsProvider } from './website-translations.component';

export const WebsiteTranslationsPlugin: Plugin = {
  name: 'website-translations',
  overrides: {
    iframe: WebsiteTranslationsProvider,
  },
};
