import { formView } from '@wepublish/form/editor';

import { documentSchema } from './document.schema';
import { DocumentFileDetails } from './documentFileDetails';

export const documentRoutes = {
  list: '/documents',
  create: '/documents/upload',
  edit: '/documents/edit/:id',
} as const;

export const documentView = formView(documentSchema, {
  paths: {
    list: documentRoutes.list,
    edit: id => `/documents/edit/${id}`,
  },
  sections: [
    {
      title: 'documents.panels.information',
      fields: ['title', 'description'],
    },
    {
      title: 'documents.panels.file',
      placement: 'aside',
      component: DocumentFileDetails,
    },
  ],
});
