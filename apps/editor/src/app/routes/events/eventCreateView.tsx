import { useMutation } from '@apollo/client/react';
import { CreateEventDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';

import { toCreateEventVariables } from './event.schema';
import { eventView } from './event.view';

export const EventCreateView = () => {
  const [createEvent] = useMutation(CreateEventDocument);
  const event = useCreateForm(eventView, {
    title: 'event.create.title',
    fields: { status: { hidden: true } },
    save: async values => {
      const { data } = await createEvent({
        variables: toCreateEventVariables(values),
      });

      return data?.createEvent.id;
    },
  });

  return <FormPage controller={event} />;
};
