import { ApolloError } from '@apollo/client';
import {
  FullEventFragment,
  FullImageFragment,
  MutationUpdateEventArgs,
  useEventQuery,
  useUpdateEventMutation,
} from '@wepublish/editor/api';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { EventForm } from './eventForm';

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

const mapApiDataToInput = (
  event: FullEventFragment
): MutationUpdateEventArgs & { image?: FullImageFragment | null } => ({
  ...event,
  imageId: event.image?.id,
  tagIds: event.tags?.map(tag => tag.id),
});

export const EventEditView = () => {
  const { id } = useParams();
  const eventId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/events';
  const [event, setEvent] = useState<
    MutationUpdateEventArgs & { image?: FullImageFragment | null }
  >({
    id: eventId,
  });

  const [shouldClose, setShouldClose] = useState(false);

  const { loading: dataLoading } = useEventQuery({
    variables: {
      id: eventId,
    },
    onError: onErrorToast,
    onCompleted: data => {
      if (data.event) {
        setEvent(mapApiDataToInput(data.event));
      }
    },
  });

  const [updateEvent, { loading: updateLoading }] = useUpdateEventMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath);
      }

      if (data.updateEvent) {
        setEvent(mapApiDataToInput(data.updateEvent));
      }
    },
  });

  const loading = dataLoading || updateLoading;

  const onSubmit = () => {
    const { image, ...eventWithoutImage } = event!;

    if (!eventWithoutImage.endsAt) {
      eventWithoutImage.endsAt = null;
    }

    updateEvent({ variables: eventWithoutImage });
  };

  const { StringType, DateType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    status: StringType().isRequired(),
    startsAt: DateType().isRequired(),
    endsAt: DateType().min(new Date(event.startsAt ?? new Date())),
  });

  return (
    <Form
      fluid
      formValue={event || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('event.edit.title')}
        loadingTitle={t('event.edit.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <EventForm
        event={event}
        onChange={changes =>
          setEvent(oldEvent => ({ ...oldEvent, ...(changes as any) }))
        }
      />
    </Form>
  );
};
