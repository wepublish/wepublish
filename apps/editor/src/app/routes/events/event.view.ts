import { type FormValues, formView } from '@wepublish/form/editor';

import { eventSchema } from './event.schema';

const withoutExternalSource = ({
  externalSourceName,
}: FormValues<typeof eventSchema>) => !externalSourceName;

export const eventView = formView(eventSchema, {
  paths: {
    list: '/events',
    edit: id => `/events/edit/${id}`,
  },
  sections: [
    {
      title: 'event.form.sections.details',
      fields: ['name', 'externalSourceName', 'location'],
    },
    {
      title: 'event.form.sections.schedule',
      fields: [['startsAt', 'endsAt'], 'status'],
    },
    {
      title: 'event.form.sections.content',
      fields: ['lead', 'description'],
    },
    {
      title: 'event.form.sections.media',
      placement: 'aside',
      fields: ['image', 'tagIds'],
    },
  ],
  fields: {
    externalSourceName: { readOnly: true, hidden: withoutExternalSource },
  },
});
