import { formView } from '@wepublish/form/editor';

import { websiteThemeSchema } from './website-theme.schema';
import { WebsiteThemeTabs } from './website-theme-tabs';

export const websiteThemeView = formView(websiteThemeSchema, {
  sections: [
    {
      component: WebsiteThemeTabs,
      covers: ['palette', 'typography', 'importedFonts'],
    },
  ],
});
