import { Plugin } from '@puckeditor/core';

import { WebsiteTranslationsProvider } from './website-translations.component';

// Only the iframe content is wrapped, so plugin panels keep the editor's i18n
export const websiteTranslationsPlugin: Plugin = {
  name: 'website-translations',
  overrides: {
    iframe: WebsiteTranslationsProvider,
  },
};
