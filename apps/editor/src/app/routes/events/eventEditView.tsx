import { useMutation } from '@apollo/client/react';
import { EventDocument, UpdateEventDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { useParams } from 'react-router-dom';

import { fromEvent, toUpdateEventVariables } from './event.schema';
import { eventView } from './event.view';

type EventEditFormProps = {
  id: string;
};

export const EventEditForm = ({ id }: EventEditFormProps) => {
  const load = useQueryLoader(EventDocument, { id }, data =>
    fromEvent(data.event)
  );
  const [updateEvent] = useMutation(UpdateEventDocument);
  const event = useEditForm(eventView, {
    title: 'event.edit.title',
    load,
    save: values =>
      updateEvent({ variables: toUpdateEventVariables(id, values) }),
  });

  return <FormPage controller={event} />;
};

export const EventEditView = () => {
  const { id } = useParams();

  return (
    <EventEditForm
      key={id}
      id={id!}
    />
  );
};
