import { bindComponent, formView } from '@wepublish/form/editor';

import { FontPickerField } from './font-picker';
import { WebsiteFontRow } from './website-font-row';
import { websiteFontsSchema } from './website-fonts.schema';

const FontPicker = bindComponent(FontPickerField);

export const websiteFontsView = formView(websiteFontsSchema, {
  sections: [{ title: 'websiteSettings.fonts.googleFonts', fields: ['fonts'] }],
  fields: {
    fonts: { props: { addLabel: 'websiteSettings.fonts.addFont' } },
    'fonts.*': { layout: WebsiteFontRow },
    'fonts.*.name': { component: FontPicker },
  },
});
