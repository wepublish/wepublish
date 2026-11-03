import { type ItemLayoutProps, editorForm } from '@wepublish/form/editor';

import { googleFontVariants } from './google-fonts';
import { websiteFontsSchema } from './website-fonts.schema';

const FontItem = editorForm.fieldsFor(websiteFontsSchema, 'fonts.*');

export function WebsiteFontRow({ index }: ItemLayoutProps) {
  return (
    <FontItem.Field
      name="name"
      onValueChange={(family, { setValue }) => {
        const variants = googleFontVariants(family);

        if (variants !== undefined) {
          setValue(`fonts.${index}.weight`, variants.weight);
          setValue(`fonts.${index}.style`, variants.style);
        }
      }}
    />
  );
}
