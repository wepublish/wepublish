import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { tagSchema } from './tag.schema';

export const tagView = formView(tagSchema, {
  sections: [
    { title: 'tags.form.sections.details', fields: ['tag', 'description'] },
    {
      title: 'tags.form.sections.display',
      placement: 'aside',
      fields: ['main', 'color'],
    },
  ],
  serverErrors: [
    {
      match: uniqueConstraint('type', 'tag'),
      path: 'tag',
      error: 'tags.form.uniqueConstraint',
    },
  ],
});
