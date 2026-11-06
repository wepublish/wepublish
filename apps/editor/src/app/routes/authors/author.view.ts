import { formView, uniqueConstraint } from '@wepublish/form/editor';
import { slugify } from '@wepublish/utils';

import { authorSchema } from './author.schema';

export const authorRoutes = {
  list: '/authors',
  create: '/authors/create',
  edit: '/authors/edit/:id',
} as const;

export const authorView = formView(authorSchema, {
  paths: {
    list: authorRoutes.list,
    edit: id => `/authors/edit/${id}`,
  },
  sections: [
    { fields: [['name', 'jobTitle'], 'slug', 'image', 'bio'] },
    { title: 'authors.panels.links', fields: ['links'] },
    {
      placement: 'aside',
      fields: [
        'tagIds',
        {
          group: ['hideOnArticle', 'hideOnTeaser', 'hideOnTeam'],
          title: 'authorEditPanel.hideAuthor',
        },
      ],
    },
  ],
  fields: {
    name: {
      onValueChange: (name, { setValue }) => setValue('slug', slugify(name)),
    },
    slug: { hidden: true },
    links: {
      props: { sortable: true, addLabel: 'authors.panels.addLink' },
    },
  },
  serverErrors: [
    {
      match: uniqueConstraint(),
      path: 'name',
      error: 'authors.panels.slugTaken',
      params: ({ slug }) => ({ slug }),
    },
  ],
});
