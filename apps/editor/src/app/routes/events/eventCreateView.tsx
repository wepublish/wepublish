import { ApolloError } from '@apollo/client';
import {
  FullImageFragment,
  MutationCreateEventArgs,
  useCreateEventMutation,
} from '@wepublish/editor/api';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

export const EventCreateView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/events';
  const [event, setEvent] = useState({
    name: '',
  } as MutationCreateEventArgs & { image?: FullImageFragment | null });

  const [shouldClose, setShouldClose] = useState(false);

  const [createEvent, { loading }] = useCreateEventMutation({
    onError: onErrorToast,
    onCompleted: event => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/events/edit/${event.createEvent?.id}`);
      }
    },
  });

  const onSubmit = () => {
    const { image, ...eventWithoutImage } = event;
    createEvent({ variables: eventWithoutImage });
  };

  const { StringType, DateType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    startsAt: DateType().isRequired(),
    endsAt: DateType().min(new Date(event.startsAt)),
  });

  return (
    <Form
      fluid
      formValue={event}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('event.create.title')}
        loadingTitle={t('event.create.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <EventForm
        event={event}
        create
        onChange={changes =>
          setEvent(oldEvent => ({ ...oldEvent, ...(changes as any) }))
        }
      />
    </Form>
  );
};
